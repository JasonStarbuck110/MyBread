const { createPortfolio, creditReward } = require("./portfolio");
const { buyStock, sellStock, SHARE_SCALE } = require("./trading");
const { calculatePortfolioValue, calculateProfitLoss } = require("./analytics");
const portfolio = createPortfolio();

console.log("Starting Cash: $", portfolio.cashCents / 100);

creditReward(portfolio, "lesson-1", 500);

try {
    creditReward(portfolio, "lesson-1", 500);
} catch (error) {
    console.log("Reward Rejected:", error.message);
}

console.log("After Lesson 1: $", portfolio.cashCents / 100);

creditReward(portfolio, "lesson-2", 1000);

console.log("After Lesson 2: $", portfolio.cashCents / 100);
console.log("Reward History:", portfolio.rewardHistory);
console.log("\n--- BUYING TESTS ---");

buyStock(portfolio, "AAPL", 500, 20000);
buyStock(portfolio, "AAPL", 500, 20000);

try {
    buyStock(portfolio, "AAPL", 1000, 20000);
} catch (error) {
    console.log("Purchase Rejected:", error.message);
}

console.log("Remaining Cash: $", portfolio.cashCents / 100);
console.log("AAPL Shares:", portfolio.holdings["AAPL"] / SHARE_SCALE);
console.log("\n--- SELLING TESTS ---");

sellStock(portfolio, "AAPL", 0.02, 25000);

try {
    sellStock(portfolio, "AAPL", 0.04, 25000);
} catch (error) {
    console.log("Sale Rejected:", error.message);
}

console.log("Cash After Sale: $", portfolio.cashCents / 100);
console.log("AAPL Shares Remaining:", portfolio.holdings["AAPL"] / SHARE_SCALE);
console.log("\n--- TRANSACTION HISTORY ---");
console.log(portfolio.transactions);
console.log("\n--- PORTFOLIO ANALYTICS ---");

const marketPrices = {
    AAPL: 25000,
    MSFT: 42000,
    GOOGL: 18000
};
const portfolioValue = calculatePortfolioValue(portfolio, marketPrices);
console.log("Available Cash: $", portfolio.cashCents / 100);
console.log("Total Portfolio Value: $", portfolioValue / 100);
console.log("\n--- PROFIT AND LOSS ---");
const profitLoss = calculateProfitLoss(portfolio, marketPrices);
console.log("Realized Profit: $", profitLoss.realizedGainCents / 100);
console.log("Unrealized Profit: $", profitLoss.unrealizedGainCents / 100);
console.log("Total Investment Profit: $", profitLoss.totalGainCents / 100);
console.log("\n--- INDIVIDUAL STOCK PERFORMANCE ---");
console.log(profitLoss.stockPerformance);
console.log("AAPL Unrealized Return:", profitLoss.stockPerformance["AAPL"].unrealizedReturnPercent.toFixed(2) + "%");