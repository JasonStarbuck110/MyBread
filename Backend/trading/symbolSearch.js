const { providerRequest } = require("./providerGuard");
const cache = new Map();
const TTL_MS = 60 * 60 * 1000;
async function searchSymbols(query) {
    const key = query.trim().toLowerCase();
    const existing = cache.get(key);
    if (existing && Date.now() - existing.time < TTL_MS) return existing.results;
    if (!process.env.TWELVE_DATA_API_KEY) throw new Error("Twelve Data API Key Missing");

    const url = new URL("https://api.twelvedata.com/symbol_search");
    url.searchParams.set("symbol", query);
    url.searchParams.set("apikey", process.env.TWELVE_DATA_API_KEY);
    const data = await providerRequest(url, `symbol_search:${key}`);
    if (data.status === "error" || data.code) throw new Error("Market Data Provider Rejected Request");

    const results = (Array.isArray(data.data) ? data.data : [])
        .filter(item => /^[A-Z][A-Z0-9.-]{0,14}$/.test(item.symbol || "") &&
            ["Common Stock", "ETF", "Exchange Traded Fund", "Equity"].includes(item.instrument_type))
        .slice(0, 20)
        .map(item => ({symbol: item.symbol, name: String(item.instrument_name || item.symbol).slice(0, 100), exchange: String(item.exchange || "").slice(0, 50)}));
    cache.set(key, {time: Date.now(), results});
    if (cache.size > 200) cache.delete(cache.keys().next().value);
    
    return results;
}
module.exports = {searchSymbols};
