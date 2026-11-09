"use strict";

const express = require("express");
const mongoose = require("mongoose");
const MiniLessonCompletion = require("../models/MiniLessonCompletion");
const ExpTransaction = require("../models/ExpTransaction");
const StudentProgress = require("../models/StudentProgress");
const MINI_REWARD_CENTS = 100; // $1.00 per mini-lesson
const MINI_REWARD_XP = 10;
const { authenticateToken, requireRole } = require("../middleware/auth");
const TradingPortfolio = require("../models/TradingPortfolio");
const LessonCompletion = require("../models/LessonCompletion");
const { createPortfolio } = require("../trading/portfolio");
const { buyStock, sellStock } = require("../trading/trading");
const { getStockPrice, getMarketPrices, getStockQuote } = require("../trading/marketData");
const { getPortfolioSummary } = require("../trading/analytics");
const { getPortfolioHistory, getStockHistory } = require("../trading/portfolioHistory");
const { configurationFor } = require("../trading/marketHistory");
const { searchSymbols } = require("../trading/symbolSearch");
const router = express.Router();
const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve().then(() => handler(req, res)).catch(next);
};
const symbolPattern = /^[A-Z][A-Z0-9.-]{0,14}$/;
const REWARDS = Object.freeze({ 1: 500, 2: 500, 3: 500, 4: 500, 5: 500 });

router.use(authenticateToken, requireRole("student"));

async function portfolioDocument(studentId) {
  return TradingPortfolio.findOneAndUpdate(
    { studentId },
    { $setOnInsert: { studentId, ...createPortfolio() } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

function portfolioObject(document) {
  const data = document.toObject({ flattenMaps: true });
  return {
    cashCents: data.cashCents,
    holdings: data.holdings || {},
    transactions: data.transactions || [],
    rewardHistory: data.rewardHistory || []
  };
}

async function changePortfolio(studentId, action) {
  const document = await portfolioDocument(studentId);
  const portfolio = portfolioObject(document);
  const result = action(portfolio);
  document.cashCents = portfolio.cashCents;
  document.holdings = new Map(Object.entries(portfolio.holdings));
  document.transactions = portfolio.transactions;
  document.rewardHistory = portfolio.rewardHistory;
  await document.save();
  return { result, portfolio };
}

router.get("/portfolio", asyncRoute(async (req, res) => {
  const portfolio = portfolioObject(await portfolioDocument(req.user.id));
  const owned = Object.entries(portfolio.holdings)
    .filter(([, units]) => units > 0)
    .map(([symbol]) => symbol);
  const prices = await getMarketPrices(owned);
  res.json(getPortfolioSummary(portfolio, prices));
}));

router.get("/portfolio/history", asyncRoute(async (req, res) => {
  const range = req.query.range || "1M";
  configurationFor(range);
  const portfolio = portfolioObject(await portfolioDocument(req.user.id));
  res.json(await getPortfolioHistory(portfolio, range));
}));

router.post("/trades/buy", asyncRoute(async (req, res) => {
  const { symbol, amountCents } = req.body || {};
  if (typeof symbol !== "string" || !symbolPattern.test(symbol) ||
      !Number.isSafeInteger(amountCents) || amountCents <= 0) {
    return res.status(400).json({ error: "Invalid buy request" });
  }
  const priceCents = await getStockPrice(symbol);
  const { result, portfolio } = await changePortfolio(req.user.id,
    (p) => buyStock(p, symbol, amountCents, priceCents));
  res.status(201).json({ transaction: result, cashCents: portfolio.cashCents,
    sharesUnits: portfolio.holdings[symbol] });
}));

router.post("/trades/sell", asyncRoute(async (req, res) => {
  const { symbol, sharesToSell } = req.body || {};
  if (typeof symbol !== "string" || !symbolPattern.test(symbol) ||
      !Number.isFinite(sharesToSell) || sharesToSell <= 0) {
    return res.status(400).json({ error: "Invalid sell request" });
  }
  const priceCents = await getStockPrice(symbol);
  const { result, portfolio } = await changePortfolio(req.user.id,
    (p) => sellStock(p, symbol, sharesToSell, priceCents));
  res.status(201).json({ transaction: result, cashCents: portfolio.cashCents,
    sharesUnits: portfolio.holdings[symbol] });
}));

router.post("/rewards/minis/sync", asyncRoute(async (req, res) => {
  const studentId = req.user.id;
  const completions = await MiniLessonCompletion.find({ studentId })
    .select("lessonId sectionIndex")
    .lean();

  const validCompletions = completions
    .filter(item => Number.isInteger(Number(item.lessonId)) &&
      Number(item.lessonId) >= 1 && Number(item.lessonId) <= 5 &&
      Number.isSafeInteger(item.sectionIndex) &&
      item.sectionIndex >= 0 && item.sectionIndex < 5)
    .map(item => ({
      id: `mini-${Number(item.lessonId)}-${item.sectionIndex}`,
      lessonId: Number(item.lessonId),
      sectionIndex: item.sectionIndex
    }));

  await portfolioDocument(studentId);
  const session = await mongoose.startSession();
  var awardedCount = 0;

  try {
    awardedCount = await session.withTransaction(async () => {
      const portfolio = await TradingPortfolio.findOne({ studentId }).session(session);
      if (!portfolio) throw new Error("Student portfolio missing");
      if (validCompletions.length === 0) return 0;

      const existingXp = await ExpTransaction.find({
        studentId,
        sourceType: "lesson",
        sourceId: { $in: validCompletions.map(item => item.id) }
      }).select("sourceId").session(session).lean();
      const xpIds = new Set(existingXp.map(row => row.sourceId));
      const cashIds = new Set(portfolio.rewardHistory.map(row => row.id));
      const mismatched = validCompletions.some(item =>
        cashIds.has(item.id) !== xpIds.has(item.id));
      if (mismatched) {
        throw new Error("Mini-lesson reward records are inconsistent; administrator review required");
      }

      const pending = validCompletions.filter(item => !cashIds.has(item.id));
      if (pending.length === 0) return 0;
      const now = new Date();
      const cashCents = pending.length * MINI_REWARD_CENTS;
      const xp = pending.length * MINI_REWARD_XP;

      await ExpTransaction.insertMany(pending.map(item => ({
        studentId,
        amount: MINI_REWARD_XP,
        reason: `Completed mini-lesson ${item.lessonId}.${item.sectionIndex + 1}`,
        sourceType: "lesson",
        sourceId: item.id
      })), { session });

      await StudentProgress.findOneAndUpdate(
        { studentId },
        {
          $inc: { totalExp: xp },
          $set: { lastActivityAt: now },
          $setOnInsert: { studentId }
        },
        { upsert: true, setDefaultsOnInsert: true, session }
      );

      const updated = await TradingPortfolio.findOneAndUpdate(
        { studentId, "rewardHistory.id": { $nin: pending.map(item => item.id) } },
        {
          $inc: { cashCents, __v: 1 },
          $push: { rewardHistory: { $each: pending.map(item => ({
            id: item.id,
            amountCents: MINI_REWARD_CENTS,
            earnedAt: now.toISOString()
          })) } }
        },
        { new: true, session }
      );
      if (!updated) throw new Error("Concurrent reward claim; retry the request");
      return pending.length;
    });
  } finally {
    await session.endSession();
  }

  const [portfolio, progress] = await Promise.all([
    TradingPortfolio.findOne({ studentId }).lean(),
    StudentProgress.findOne({ studentId }).lean()
  ]);
  res.json({
    awardedCount,
    earnedCashCents: awardedCount * MINI_REWARD_CENTS,
    earnedXp: awardedCount * MINI_REWARD_XP,
    cashCents: portfolio.cashCents,
    totalExp: progress?.totalExp ?? 0
  });
}));

router.post("/rewards/module", asyncRoute(async (req, res) => {
  const moduleId = Number(req.body?.moduleId);
  const rewardCents = REWARDS[moduleId];
  if (!Number.isSafeInteger(moduleId) || !rewardCents) {
    return res.status(400).json({ error: "Invalid module" });
  }

  const studentId = req.user.id;
  const lessonId = String(moduleId);
  const passed = await LessonCompletion.exists({ studentId, lessonId });
  if (!passed) {
    return res.status(403).json({ error: "Complete and pass the module quiz first" });
  }

  await portfolioDocument(studentId);
  const rewardId = `module-${moduleId}-quiz`;
  const earnedAt = new Date().toISOString();
  const updated = await TradingPortfolio.findOneAndUpdate(
    { studentId, "rewardHistory.id": { $ne: rewardId } },
    {
      $inc: { cashCents: rewardCents, __v: 1 },
      $push: { rewardHistory: { id: rewardId, amountCents: rewardCents, earnedAt } }
    },
    { new: true }
  );
  const portfolio = updated || await TradingPortfolio.findOne({ studentId });
  res.json({ credited: Boolean(updated), cashCents: portfolio.cashCents,
    rewardCents: updated ? rewardCents : 0 });
}));

router.get("/stocks/:symbol/quote", asyncRoute(async (req, res) => {
  res.json(await getStockQuote(req.params.symbol));
}));
router.get("/stocks/:symbol/history", asyncRoute(async (req, res) => {
  const { symbol } = req.params;
  const range = req.query.range || "1M";
  if (!symbolPattern.test(symbol)) {
    return res.status(400).json({ error: "Invalid stock symbol" });
  }
  configurationFor(range);
  res.json(await getStockHistory(symbol, range));
}));
router.get("/search", asyncRoute(async (req, res) => {
  const query = String(req.query.q || "").trim();
  if (query.length < 2 || query.length > 40 || !/^[a-zA-Z0-9 .&-]+$/.test(query)) {
    return res.status(400).json({ error: "Invalid search query" });
  }
  res.json({ results: await searchSymbols(query) });
}));

module.exports = router;