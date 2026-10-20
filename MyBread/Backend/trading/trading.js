const SHARE_SCALE = 1000000;

function buyStock(portfolio, symbol, amountCents, priceCents) {
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
        throw new Error("Invalid Investment Amount");
    }

    if (!Number.isSafeInteger(priceCents) || priceCents <= 0) {
        throw new Error("Invalid Stock Price");
    }

    if (typeof symbol !== "string" || !/^[A-Z][A-Z0-9.-]*$/.test(symbol)) {
        throw new Error("Invalid Stock Symbol");
    }

    if (amountCents > portfolio.cashCents) {
        throw new Error("Insufficient Funds");
    }

    if (!Number.isSafeInteger(amountCents * SHARE_SCALE)) {
        throw new Error("Investment Amount Too Large");
    }

    const sharesPurchasedUnits = Math.floor( (amountCents * SHARE_SCALE) / priceCents );
    if (!Number.isSafeInteger(sharesPurchasedUnits) ||
        sharesPurchasedUnits <= 0) {
        throw new Error("Investment Amount Too Low");
    }

    const currentShareUnits = portfolio.holdings[symbol] ?? 0;
    const newShareUnits = currentShareUnits + sharesPurchasedUnits;
    if (!Number.isSafeInteger(currentShareUnits) ||
        currentShareUnits < 0 ||
        !Number.isSafeInteger(newShareUnits)) {
        throw new Error("Invalid Share Balance");
    }

    const totalPriceUnits = sharesPurchasedUnits * priceCents;
    if (!Number.isSafeInteger(totalPriceUnits)) {
        throw new Error("Investment Value Too Large");
    }

    const actualCostCents = Math.ceil( totalPriceUnits / SHARE_SCALE );
    if (!Number.isSafeInteger(actualCostCents) ||
        actualCostCents <= 0 ||
        actualCostCents > amountCents) {
        throw new Error("Invalid Purchase Cost");
    }

    portfolio.holdings[symbol] = newShareUnits;
    portfolio.cashCents -= actualCostCents;

    const transaction = {
        type: "BUY",
        symbol: symbol,
        sharesUnits: sharesPurchasedUnits,
        priceCents: priceCents,
        amountCents: actualCostCents,
        timestamp: new Date().toISOString()
    };

    portfolio.transactions.push(transaction);

    console.log( "Purchased Shares:", sharesPurchasedUnits / SHARE_SCALE );

    return transaction;
}

function sellStock(portfolio, symbol, sharesToSell, priceCents) {
    if (!Number.isFinite(sharesToSell) || sharesToSell <= 0) {
        throw new Error("Invalid Shares to Sell");
    }

    if (!Number.isSafeInteger(priceCents) || priceCents <= 0) {
        throw new Error("Invalid Stock Price");
    }

    if (typeof symbol !== "string" || !/^[A-Z][A-Z0-9.-]*$/.test(symbol)) {
        throw new Error("Invalid Stock Symbol");
    }

    const scaledShares = sharesToSell * SHARE_SCALE;
    const sharesToSellUnits = Math.round(scaledShares);
    if (!Number.isSafeInteger(sharesToSellUnits) ||
        sharesToSellUnits <= 0 ||
        Math.abs(scaledShares - sharesToSellUnits) > 1e-7) {
        throw new Error("Invalid Share Quantity");
    }

    const currentShareUnits = portfolio.holdings[symbol] ?? 0;
    if (!Number.isSafeInteger(currentShareUnits) ||
        currentShareUnits < 0) {
        throw new Error("Invalid Share Balance");
    }

    if (sharesToSellUnits > currentShareUnits) {
        throw new Error("Insufficient Shares to Sell");
    }

    const totalPriceUnits = sharesToSellUnits * priceCents;
    if (!Number.isSafeInteger(totalPriceUnits)) {
        throw new Error("Sale Value Too Large");
    }

    const saleProceedsCents = Math.floor( totalPriceUnits / SHARE_SCALE );
    if (!Number.isSafeInteger(saleProceedsCents) ||
        saleProceedsCents <= 0) {
        throw new Error("Invalid Sale Proceeds");
    }

    if (!Number.isSafeInteger(
        portfolio.cashCents + saleProceedsCents
    )) {
        throw new Error("Wallet Balance Exceeds Supported Range");
    }

    portfolio.holdings[symbol] -= sharesToSellUnits;
    portfolio.cashCents += saleProceedsCents;

    const transaction = {
        type: "SELL",
        symbol: symbol,
        sharesUnits: sharesToSellUnits,
        priceCents: priceCents,
        amountCents: saleProceedsCents,
        timestamp: new Date().toISOString()
    };

    portfolio.transactions.push(transaction);

    console.log( "Sold Shares:", sharesToSellUnits / SHARE_SCALE );

    return transaction;
}

module.exports = {
    buyStock,
    sellStock,
    SHARE_SCALE
};
