const { getPortfolioSummary } = require("./analytics");
const { getMarketPrices } = require("./marketData");
const { getHistoricalPrices, filterRange } = require("./marketHistory");

function getEvents(portfolio) {
    const events = [
        ...portfolio.rewardHistory.map((reward) => ({
            timestamp: Date.parse(reward.earnedAt),
            type: "REWARD",
            amountCents: reward.amountCents
        })),
        ...portfolio.transactions.map((trade) => ({
            timestamp: Date.parse(trade.timestamp),
            type: trade.type,
            amountCents: trade.amountCents,
            sharesUnits: trade.sharesUnits,
            symbol: trade.symbol
        }))
    ];
    for (const event of events) {
        if (!Number.isFinite(event.timestamp) || !Number.isSafeInteger(event.amountCents)
            || event.amountCents <= 0 || !["REWARD", "BUY", "SELL"].includes(event.type)
            || (event.type !== "REWARD" && (!Number.isSafeInteger(event.sharesUnits)
                || event.sharesUnits <= 0))) {
            throw new Error("Invalid historical portfolio event");
        }
    }
    return events.sort((a, b) => a.timestamp - b.timestamp);
}

function buildPortfolioTimeline(portfolio, histories, currentSummary, now = Date.now(), range = "1M") {
    const events = getEvents(portfolio);
    if (!events.length) return [];

    const allDates = new Set([now]);
    const visibleDates = new Set([now]);
    for (const entry of histories) {
        for (const candle of entry.prices) allDates.add(candle.timestamp);
        for (const candle of filterRange(entry.prices, range, entry.timezone, now)) {
            visibleDates.add(candle.timestamp);
        }
    }
    for (const event of events) {
        const dates = [...visibleDates].filter((t) => t !== now);
        const minTime = dates.length ? Math.min(...dates) : now;
        if (event.timestamp >= minTime && event.timestamp <= now) {
            allDates.add(event.timestamp);
            visibleDates.add(event.timestamp);
        }
    }

    const candleMap = new Map();
    for (const entry of histories) {
        for (const candle of entry.prices) {
            if (!candleMap.has(candle.timestamp)) candleMap.set(candle.timestamp, []);
            candleMap.get(candle.timestamp).push({ symbol: entry.symbol, priceCents: candle.priceCents });
        }
    }
    const timestamps = [...allDates].filter((t) => t <= now).sort((a, b) => a - b);
    const current = { cashCents: 0, holdings: {}, transactions: [], rewardHistory: [] };
    const latestPrices = {};
    var nextEvent = 0;
    var netRewardsCents = 0;
    const points = [];

    for (const timestamp of timestamps) {
        for (const update of candleMap.get(timestamp) || []) {
            latestPrices[update.symbol] = update.priceCents;
        }
        while (nextEvent < events.length && events[nextEvent].timestamp <= timestamp) {
            const event = events[nextEvent++];
            if (event.type === "REWARD") {
                current.cashCents += event.amountCents;
                netRewardsCents += event.amountCents;
                current.rewardHistory.push(event);
            } else if (event.type === "BUY") {
                current.cashCents -= event.amountCents;
                current.holdings[event.symbol] = (current.holdings[event.symbol] || 0) + event.sharesUnits;
                current.transactions.push(event);
            } else {
                current.cashCents += event.amountCents;
                current.holdings[event.symbol] = (current.holdings[event.symbol] || 0) - event.sharesUnits;
                current.transactions.push(event);
            }
        }
        if (!visibleDates.has(timestamp) || nextEvent === 0) continue;
        if (timestamp === now) {
            points.push({
                timestamp: new Date(now).toISOString(),
                totalValueCents: currentSummary.totalValueCents,
                gainCents: currentSummary.totalGainCents,
                netRewardsCents
            });
            continue;
        }
        const missing = Object.entries(current.holdings).some(([symbol, units]) =>
            units > 0 && latestPrices[symbol] === undefined
        );
        if (missing || current.cashCents < 0) continue;
        const summary = getPortfolioSummary(current, latestPrices);
        points.push({
            timestamp: new Date(timestamp).toISOString(),
            totalValueCents: summary.totalValueCents,
            gainCents: summary.totalGainCents,
            netRewardsCents
        });
    }
    return points;
}

async function getPortfolioHistory(portfolio, range) {
    const symbols = [...new Set(portfolio.transactions.map((trade) => trade.symbol))];
    const histories = [];
    for (const symbol of symbols) histories.push(await getHistoricalPrices(symbol, range));
    const heldSymbols = Object.entries(portfolio.holdings)
        .filter(([, units]) => units > 0).map(([symbol]) => symbol);
    const prices = await getMarketPrices(heldSymbols);
    const summary = getPortfolioSummary(portfolio, prices);
    const points = buildPortfolioTimeline(portfolio, histories, summary, Date.now(), range);
    return { range, kind: "portfolio", points, currentValueCents: summary.totalValueCents,
        note: "Reconstructed from recorded rewards/trades and Twelve Data historical closing prices. Values between samples are estimates; history begins when the account was funded." };
}

async function getStockHistory(symbol, range) {
    const result = await getHistoricalPrices(symbol, range);
    return { range, kind: "stock", symbol, points: filterRange(result.prices, range, result.timezone)
        .map((point) => ({ timestamp: new Date(point.timestamp).toISOString(), priceCents: point.priceCents })),
        note: "Historical stock prices from Twelve Data, not past ownership or simulated trades." };
}

module.exports = { buildPortfolioTimeline, getPortfolioHistory, getStockHistory };
