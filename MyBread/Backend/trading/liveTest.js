const { getStockPrice, getMarketPrices } = require("./marketData");
const { createPortfolio, creditReward } = require("./portfolio");
const { buyStock } = require("./trading");
const { getPortfolioSummary } = require("./analytics");

async function main() {
    const portfolio = createPortfolio();
    creditReward(portfolio, "lesson-1", 500);

    const priceCents = await getStockPrice("AAPL");

    console.log("AAPL Latest Available Price: $", priceCents / 100);

    buyStock(portfolio, "AAPL", 500, priceCents);

    const prices = await getMarketPrices(Object.keys(portfolio.holdings));
    const summary = getPortfolioSummary(portfolio, prices);

    console.log("\n--- Portfolio Summary ---");
    console.log(summary);
}
main().catch(error => {
    console.error("Market test failed:", error.stack);
    process.exitCode = 1;
});