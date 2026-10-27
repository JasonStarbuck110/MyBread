const { providerRequest } = require("./providerGuard");
const API_URL = "https://api.twelvedata.com/price";
const CACHE_DURATION_MS = 5 * 60 * 1000;
const priceCache = new Map();

async function getStockPrice(symbol) {
    if (typeof symbol !== "string" ||
        !/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol)) {
        throw new Error("Invalid Stock Symbol");
    }

    const cached = priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
        return cached.priceCents;
    }

    const apiKey = process.env.TWELVE_DATA_API_KEY;
    if (!apiKey) {
        throw new Error("Twelve Data API Key Missing");
    }

    const url = new URL(API_URL);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("apikey", apiKey);
    const data = await providerRequest(url, `price:${symbol}`);
    if (data.status === "error" || data.code) {
        throw new Error("Market Data Provider Rejected Request");
    }

    const price = Number(data.price);
    const priceCents = Math.round(price * 100);
    if (!Number.isFinite(price) ||
        price <= 0 ||
        !Number.isSafeInteger(priceCents) ||
        priceCents <= 0) {
        throw new Error("Invalid Market Price");
    }

    priceCache.set(symbol, {
        priceCents,
        timestamp: Date.now()
    });

    return priceCents;
}

async function getMarketPrices(symbols) {
    if (!Array.isArray(symbols)) {
        throw new Error("Invalid Stock Symbol List");
    }

    const prices = {};
    for (const symbol of new Set(symbols)) {
        prices[symbol] = await getStockPrice(symbol);
    }

    return prices;
}

const quoteCache = new Map();
const QUOTE_CACHE_MS = 10 * 60 * 1000;

async function getStockQuote(symbol) {
    if (
        typeof symbol !== "string" ||
        !/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol)
    ) {
        throw new Error("Invalid Stock Symbol");
    }

    const cached = quoteCache.get(symbol);
    if (
        cached &&
        Date.now() - cached.timestamp < QUOTE_CACHE_MS
    ) {
        return cached.data;
    }

    const apiKey = process.env.TWELVE_DATA_API_KEY;
    if (!apiKey) {
        throw new Error("Twelve Data API Key Missing");
    }

    const url = new URL("https://api.twelvedata.com/quote");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("apikey", apiKey);

    const data = await providerRequest(url, `quote:${symbol}`);
    if (data.status === "error" || data.code) {
        throw new Error("Market Data Provider Rejected Request");
    }

    const price = Number(data.close);
    const percentChange = Number(data.percent_change);
    const priceCents = Math.round(price * 100);
    if (
        !Number.isFinite(price) ||
        price <= 0 ||
        !Number.isSafeInteger(priceCents)
    ) {
        throw new Error("Invalid Market Quote");
    }

    const quote = {
        symbol,
        companyName: data.name || symbol,
        priceCents,
        percentChange: data.percent_change != null &&
            Number.isFinite(percentChange)
                ? percentChange
                : null
    };

    quoteCache.set(symbol, {
        data: quote,
        timestamp: Date.now()
    });

    return quote;
}

module.exports = {
    getStockPrice,
    getMarketPrices,
    getStockQuote
};
