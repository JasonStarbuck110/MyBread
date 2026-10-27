const { SHARE_SCALE } = require("./trading");

function calculatePortfolioValue(portfolio, marketPrices) {
    var investmentValueCents = 0;

    for (const [symbol, sharesUnits] of Object.entries(portfolio.holdings)) {
        if (!Number.isSafeInteger(sharesUnits) || sharesUnits < 0) {
            throw new Error(`Invalid Holdings for ${symbol}`);
        }

        if (sharesUnits === 0) {
            continue;
        }

        const currentPriceCents = marketPrices[symbol];
        if (!Number.isSafeInteger(currentPriceCents) || currentPriceCents <= 0) {
            throw new Error(`Invalid or Missing Market Price for ${symbol}`);
        }

        const totalPriceUnits = sharesUnits * currentPriceCents;
        if (!Number.isSafeInteger(totalPriceUnits)) {
            throw new Error("Investment Value Too Large");
        }

        const stockValueCents = Math.round(
            totalPriceUnits / SHARE_SCALE
        );

        investmentValueCents += stockValueCents;

        if (!Number.isSafeInteger(investmentValueCents)) {
            throw new Error("Total Investment Value Too Large");
        }
    }

    if (!Number.isSafeInteger(portfolio.cashCents) || portfolio.cashCents < 0) {
        throw new Error("Invalid Wallet Balance");
    }

    const totalPortfolioValueCents = portfolio.cashCents + investmentValueCents;
    if (!Number.isSafeInteger(totalPortfolioValueCents)) {
        throw new Error("Portfolio Value Too Large");
    }

    return totalPortfolioValueCents;
}

function calculateProfitLoss(portfolio, marketPrices) {
    const positions = {};
    var realizedGainCents = 0;

    for (const transaction of portfolio.transactions) {
        const {type, symbol, sharesUnits, amountCents } = transaction;
        if(!positions[symbol]) {
            positions[symbol] = {
                sharesUnits: 0,
                costCents: 0
            };
        }

        const position = positions[symbol];
        if (type === "BUY") {
            position.sharesUnits += sharesUnits;
            position.costCents += amountCents;
        }
        
        else if (type === "SELL") {
            if (sharesUnits > position.sharesUnits) {
                throw new Error(`Selling more shares than held for ${symbol}`);
            }

            const costOfSoldSharesCents = sharesUnits === position.sharesUnits ? position.costCents : Math.round((sharesUnits / position.sharesUnits) * position.costCents);
            const profitCents = amountCents - costOfSoldSharesCents;

            realizedGainCents += profitCents;
            position.sharesUnits -= sharesUnits;
            position.costCents -= costOfSoldSharesCents;
        }
    }

    var unrealizedGainCents = 0;
    const stockPerformance = {};

    for (const [symbol, position] of Object.entries(positions)) {
        if (position.sharesUnits !== (portfolio.holdings[symbol] ?? 0)) {
            throw new Error(`Holdings Mismatch for ${symbol}`);
        }

        if (position.sharesUnits === 0) {
            continue;
        }

        const currentPriceCents = marketPrices[symbol];
        if (!Number.isSafeInteger(currentPriceCents) || currentPriceCents <= 0) {
            throw new Error(`Invalid Market Price for ${symbol}`);
        }

        const totalPriceUnits = position.sharesUnits * currentPriceCents;
        if (!Number.isSafeInteger(totalPriceUnits)) {
            throw new Error("Investment Value Too Large");
        }
        const currentValueCents = Math.round(
            totalPriceUnits / SHARE_SCALE
        );
        const gainCents = currentValueCents - position.costCents;
        const unrealizedReturnPercent = position.costCents > 0 ? (gainCents / position.costCents) * 100 : null;

        stockPerformance[symbol] = {
            sharesUnits: position.sharesUnits,
            costCents: position.costCents,
            currentValueCents: currentValueCents,
            unrealizedGainCents: gainCents,
            unrealizedReturnPercent: unrealizedReturnPercent
        };

        unrealizedGainCents += gainCents;

        if (!Number.isSafeInteger(unrealizedGainCents)) {
            throw new Error("Unrealized Gain Exceeds Supported Range");
        }
    }

    const totalGainCents = realizedGainCents + unrealizedGainCents;
    if (!Number.isSafeInteger(totalGainCents)) {
        throw new Error("Total Gain Exceeds Supported Range");
    }

    return { realizedGainCents, unrealizedGainCents, totalGainCents, stockPerformance};
}

function getPortfolioSummary(portfolio, marketPrices) {
    const totalValueCents = calculatePortfolioValue(
        portfolio,
        marketPrices
    );
    const profitLoss = calculateProfitLoss(
        portfolio,
        marketPrices
    );
    const cashCents = portfolio.cashCents;
    const investmentsValueCents = totalValueCents - cashCents;

    return {
        cashCents,
        investmentsValueCents,
        totalValueCents,
        realizedGainCents: profitLoss.realizedGainCents,
        unrealizedGainCents: profitLoss.unrealizedGainCents,
        totalGainCents: profitLoss.totalGainCents,
        holdings: profitLoss.stockPerformance
    };
}

module.exports = { calculatePortfolioValue, calculateProfitLoss, getPortfolioSummary };