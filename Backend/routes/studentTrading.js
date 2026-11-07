"use strict";

// Isolated, authenticated trading routes. No demo portfolio is accessed here.
const express = require("express");
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
  // The identity comes exclusively from the verified JWT, never a client parameter.
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
  // TradingPortfolio already has optimisticConcurrency; simultaneous trades
  // cannot silently overwrite one another. On conflict, return 409 and retry.
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

// Module rewards are authorized by actual completed server-side lessons.
// Atomic $inc/$push ensures repeated submissions cannot credit the same reward.
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

// Market-data endpoints still use the existing Twelve Data backend utilities.
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
