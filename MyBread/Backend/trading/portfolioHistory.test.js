const test = require("node:test");
const assert = require("node:assert/strict");
const { buildPortfolioTimeline } = require("./portfolioHistory");
const { filterRange } = require("./marketHistory");

test("portfolio history values positions actually owned and tracks reward funding separately", () => {
    const rewardTime = Date.parse("2026-10-12T13:00:00Z");
    const buyTime = Date.parse("2026-10-12T13:30:00Z");
    const sellTime = Date.parse("2026-10-13T14:20:00Z");
    const now = Date.parse("2026-10-13T16:00:00Z");
    const portfolio = {
        cashCents: 1220,
        holdings: { AAPL: 15000 },
        rewardHistory: [{ id: "test-reward", amountCents: 1500, earnedAt: new Date(rewardTime).toISOString() }],
        transactions: [
            { type: "BUY", symbol: "AAPL", sharesUnits: 25000, amountCents: 500, timestamp: new Date(buyTime).toISOString() },
            { type: "SELL", symbol: "AAPL", sharesUnits: 10000, amountCents: 220, timestamp: new Date(sellTime).toISOString() }
        ]
    };
    const history = [{ symbol: "AAPL", timezone: "America/New_York", prices: [
        { timestamp: Date.parse("2026-10-12T13:20:00Z"), priceCents: 20000 },
        { timestamp: Date.parse("2026-10-12T15:00:00Z"), priceCents: 21000 },
        { timestamp: Date.parse("2026-10-13T14:00:00Z"), priceCents: 22000 },
        { timestamp: Date.parse("2026-10-13T15:00:00Z"), priceCents: 23000 }
    ] }];
    const points = buildPortfolioTimeline(portfolio, history,
        { totalValueCents: 1565, totalGainCents: 65 }, now, "1M");
    const at = (time) => points.find(p => p.timestamp === new Date(time).toISOString());
    assert.equal(at(Date.parse("2026-10-12T13:20:00Z")).totalValueCents, 1500);
    assert.equal(at(buyTime).totalValueCents, 1500);
    assert.equal(at(Date.parse("2026-10-12T15:00:00Z")).totalValueCents, 1525);
    assert.equal(at(sellTime).totalValueCents, 1550);
    assert.equal(at(Date.parse("2026-10-13T15:00:00Z")).totalValueCents, 1565);
    assert.equal(at(now).gainCents, 65);
    assert.equal(at(now).netRewardsCents, 1500);
});

test("the 1D option displays the latest stock session, not an empty weekend", () => {
    const candles = [
        { timestamp: Date.parse("2026-10-15T20:00:00Z"), priceCents: 10000 },
        { timestamp: Date.parse("2026-10-16T18:00:00Z"), priceCents: 10100 },
        { timestamp: Date.parse("2026-10-16T20:00:00Z"), priceCents: 10200 }
    ];
    assert.deepEqual(filterRange(candles, "1D", "America/New_York", Date.parse("2026-10-18T18:00:00Z")), candles.slice(1));
});

test("historical market dates use correct New York close time across daylight saving", async () => {
    const { getHistoricalPrices } = require("./marketHistory");
    const previousFetch = global.fetch;
    const previousKey = process.env.TWELVE_DATA_API_KEY;
    process.env.TWELVE_DATA_API_KEY = "local-test-key";
    global.fetch = async (url) => {
        assert.match(String(url), /^https:\/\/api\.twelvedata\.com\/time_series\?/);
        assert.equal(new URL(url).searchParams.get("symbol"), "TZTEST");
        return {
            ok: true,
            async json() {
                return {
                    meta: { exchange_timezone: "America/New_York", currency: "USD" },
                    values: [
                        { datetime: "2026-07-15", close: "210.50" },
                        { datetime: "2026-01-15", close: "200.10" }
                    ]
                };
            }
        };
    };
    try {
        const results = await getHistoricalPrices("TZTEST", "3M");
        assert.equal(results.prices[0].timestamp, Date.parse("2026-01-15T21:00:00Z"));
        assert.equal(results.prices[1].timestamp, Date.parse("2026-07-15T20:00:00Z"));
        assert.equal(results.prices[1].priceCents, 21050);
    } finally {
        global.fetch = previousFetch;
        if (previousKey === undefined) delete process.env.TWELVE_DATA_API_KEY;
        else process.env.TWELVE_DATA_API_KEY = previousKey;
    }
});
