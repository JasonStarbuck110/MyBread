const TradingPortfolio = require("../models/TradingPortfolio");
const {createPortfolio, creditReward} = require("./portfolio");
const DEMO_STUDENT_ID = "mybread-demo-student";

async function initializeDemoPortfolio() {
    await TradingPortfolio.init();

    const existing = await TradingPortfolio.exists({ studentId: DEMO_STUDENT_ID });
    if(existing) {
        return;
    }

    const initialPortfolio = createPortfolio();

    creditReward(initialPortfolio, "demo-lesson-1", 500);
    creditReward(initialPortfolio, "demo-lesson-2", 1000);

    try {
        await TradingPortfolio.create({
            studentId: DEMO_STUDENT_ID,
            ...initialPortfolio
        });
    }catch (error) {
        if (error.code !== 1100) {
            throw error;
        }
    }
}

function toTradingPortfolio(document) {
    const data = document.toObject({flattenMaps: true});

    return {
        cashCents: data.cashCents,
        holdings: data.holdings ?? {},
        transactions: data.transactions ?? [],
        rewardHistory: data.rewardHistory ?? []
    };
}

async function loadPortfolio() {
    const document = await TradingPortfolio.findOne({ studentId: DEMO_STUDENT_ID });
    if (!document) {
        throw new Error("Portfolio Not Found");
    }
    return toTradingPortfolio(document);
}

async function updatePortfolio(operation) {
    const document = await TradingPortfolio.findOne({ studentId: DEMO_STUDENT_ID });
    if (!document) {
        throw new Error("Portfolio Not Found");
    }

    const portfolio = toTradingPortfolio(document);
    const result = operation(portfolio);

    document.cashCents = portfolio.cashCents;
    document.holdings = new Map(Object.entries(portfolio.holdings));
    document.transactions = portfolio.transactions;
    document.rewardHistory = portfolio.rewardHistory;
    await document.save();

    return {result, portfolio};
}

module.exports = {initializeDemoPortfolio, loadPortfolio, updatePortfolio};