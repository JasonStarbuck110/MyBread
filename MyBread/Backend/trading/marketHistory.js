const CACHE_TTL_INTRADAY_MS = 2 * 60 * 1000;
const CACHE_TTL_DAILY_MS = 20 * 60 * 1000;
const cache = new Map();

const RANGE_CONFIG = Object.freeze({
    "1D": { interval: "5min", outputsize: 110, days: 1 },
    "1W": { interval: "1h", outputsize: 90, days: 7 },
    "1M": { interval: "1h", outputsize: 300, days: 30 },
    "3M": { interval: "1day", outputsize: 105, days: 90 },
    "1Y": { interval: "1day", outputsize: 390, days: 365 },
    ALL: { interval: "1day", outputsize: 1000, days: null }
});

function configurationFor(range) {
    const config = RANGE_CONFIG[range];
    if (!config) throw new Error("Invalid history range");
    return config;
}

function localMarketCloseMs(dateText, timeZone) {
    const utcReference = new Date(`${dateText}T12:00:00Z`);
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone, timeZoneName: "shortOffset"
    });
    const tzName = formatter.formatToParts(utcReference)
        .find((part) => part.type === "timeZoneName")?.value || "GMT";
    const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(tzName);
    var offsetMinutes = 0;
    if (match) {
        offsetMinutes = (Number(match[2]) * 60 + Number(match[3] || 0))
            * (match[1] === "+" ? 1 : -1);
    } else if (tzName !== "GMT" && tzName !== "UTC") {
        throw new Error("Unsupported exchange time zone");
    }
    const naiveCloseUtc = Date.parse(`${dateText}T16:00:00Z`);
    return naiveCloseUtc - offsetMinutes * 60_000;
}

function parseCandleTime(datetime, interval, exchangeTimezone) {
    if (interval === "1day") {
        return localMarketCloseMs(datetime.slice(0, 10), exchangeTimezone);
    }
    const opening = Date.parse(datetime.replace(" ", "T") + "Z");
    const durationMinutes = interval === "5min" ? 5 : 60;
    return opening + durationMinutes * 60_000;
}

async function getHistoricalPrices(symbol, range) {
    if (typeof symbol !== "string" || !/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol)) {
        throw new Error("Invalid Stock Symbol");
    }
    const config = configurationFor(range);
    const cacheKey = `${symbol}:${range}`;
    const now = Date.now();
    const ttl = config.interval === "1day"
        ? CACHE_TTL_DAILY_MS : CACHE_TTL_INTRADAY_MS;
    const cached = cache.get(cacheKey);
    if (cached && now - cached.fetchedAt < ttl) return cached.data;

    const apiKey = process.env.TWELVE_DATA_API_KEY;
    if (!apiKey) throw new Error("Twelve Data API Key Missing");

    const url = new URL("https://api.twelvedata.com/time_series");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("interval", config.interval);
    url.searchParams.set("outputsize", String(config.outputsize));
    url.searchParams.set("timezone", "UTC");
    url.searchParams.set("adjust", "none"); 
    url.searchParams.set("apikey", apiKey);

    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Historical market data unavailable (${response.status})`);
    const data = await response.json();
    if (data.status === "error" || data.code || !Array.isArray(data.values)) {
        throw new Error("Historical prices unavailable from Twelve Data (check plan and API limits)");
    }
    if (data.meta?.currency && data.meta.currency !== "USD") {
        throw new Error("Portfolio history currently supports USD-priced securities only");
    }
    const timezone = data.meta?.exchange_timezone || "America/New_York";
    const prices = data.values.map((item) => {
        const timestamp = parseCandleTime(item.datetime, config.interval, timezone);
        const price = Number(item.close);
        const priceCents = Math.round(price * 100);
        if (!Number.isFinite(timestamp) || !Number.isSafeInteger(priceCents)
            || priceCents <= 0 || price <= 0 || timestamp > now + 60_000) {
            return null;
        }
        return { timestamp, priceCents };
    }).filter(Boolean).sort((a, b) => a.timestamp - b.timestamp);

    if (prices.length === 0) throw new Error("No historical prices returned");
    const result = { symbol, timezone, interval: config.interval, prices };
    cache.set(cacheKey, { fetchedAt: now, data: result });
    return result;
}

function marketDate(timestamp, timezone = "America/New_York") {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date(timestamp));
}

function filterRange(candles, range, timezone = "America/New_York", now = Date.now()) {
    if (!candles.length) return [];
    const config = configurationFor(range);
    if (range === "ALL") return candles;
    if (range === "1D") {
        const lastDay = marketDate(candles.at(-1).timestamp, timezone);
        return candles.filter((p) => marketDate(p.timestamp, timezone) === lastDay);
    }
    const cutoff = now - config.days * 86400_000;
    return candles.filter((p) => p.timestamp >= cutoff);
}

module.exports = { getHistoricalPrices, configurationFor, filterRange };
