const express = require("express");
const { createPortfolio, creditReward } = require("./trading/portfolio");
const { buyStock, sellStock } = require("./trading/trading");
const {
    getStockPrice,
    getMarketPrices,
    getStockQuote
} = require("./trading/marketData");
const { getPortfolioSummary } = require("./trading/analytics");
const { getPortfolioHistory, getStockHistory } = require("./trading/portfolioHistory");
const { configurationFor } = require("./trading/marketHistory");
const { connectDatabase } = require("./database");
const {initializeDemoPortfolio, loadPortfolio, updatePortfolio} = require("./trading/portfolioStore");
const authRoutes = require("./routes/auth");
const learningRoutes = require("./routes/learning");
const app = express();
app.set("trust proxy", 1);
const PORT = Number(process.env.PORT || 3001);
const classesRoutes = require("./routes/classes");

app.use(express.json({limit: "8kb"}));

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

app.use(async (req, res, next) => {
    try{
        await connectDatabase();
        next();
    }catch (error) {
        console.error("Database connection failed:", error);
        res.status(503).json({
            error: "Database temporarily unavailable"
        });
    }
});

app.use("/api", (req, res, next) => {
    const path = req.path;
    const allowed =
        path === "/health" ||
        path.startsWith("/auth/") ||
        path.startsWith("/classes/") ||
        path === "/classes" ||
        path.startsWith("/learning/") ||
        path === "/learning";

    if (!allowed) {
        return res.status(503).json({
            error: "Feature not yet available"
        });
    }
    next();
});

app.use("/api/auth", authRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/classes", classesRoutes);

app.use(require("./trading/moduleRewards"));

/*
if (process.env.NODE_ENV === "production") {
    throw new Error("Demo API Must Not Run In Production");
}
*/

const asyncRoute = fn => (req, res, next) => { Promise.resolve().then(() => fn(req, res, next)) .catch(next); };
const { searchSymbols } = require("./trading/symbolSearch");
app.get("/api/search", asyncRoute(async (req, res) => {
    const query = String(req.query.q || "").trim();
    if (query.length < 2 || query.length > 40 || !/^[a-zA-Z0-9 .&-]+$/.test(query)) {
        return res.status(400).json({error: "Invalid Search Query"});
    }
    res.json({results: await searchSymbols(query)});
}));

app.get("/api/stocks/:symbol", asyncRoute(async (req, res) => {
    const symbol = req.params.symbol;
    const priceCents = await getStockPrice(symbol);
    res.json({ symbol, priceCents });
}));

app.get("/api/stocks/:symbol/quote",
    asyncRoute(async (req, res) => {
        const symbol = req.params.symbol.toUpperCase();
        const quote = await getStockQuote(symbol);

        res.json(quote);
    })
);

app.get("/api/portfolio/history", asyncRoute(async (req, res) => {
    const range = req.query.range || "1M";
    configurationFor(range);
    const portfolio = await loadPortfolio();
    res.json(await getPortfolioHistory(portfolio, range));
}));

app.get("/api/stocks/:symbol/history", asyncRoute(async (req, res) => {
    const { symbol } = req.params;
    const range = req.query.range || "1M";
    if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol)) {
        return res.status(400).json({ error: "Invalid Stock Symbol" });
    }
    configurationFor(range);
    res.json(await getStockHistory(symbol, range));
}));

app.get("/api/portfolio", asyncRoute(async (req, res) => {
    const portfolio = await loadPortfolio();
    const symbols = Object.keys(portfolio.holdings);
    const prices = await getMarketPrices(symbols);
    const summary = getPortfolioSummary(portfolio, prices);
    res.json(summary);
}));

app.post("/api/trades/buy", asyncRoute(async (req, res) => {
    const { symbol, amountCents } = req.body ?? {};
    if (typeof symbol !== "string" ||
        !/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol) ||
        !Number.isSafeInteger(amountCents) ||
        amountCents <= 0) {
        return res.status(400).json({
            error: "Invalid Buy Request"
        });
    }

    const priceCents = await getStockPrice(symbol);
    const { result, portfolio } = await updatePortfolio(
        p => buyStock(p, symbol, amountCents, priceCents)
    );

    res.status(201).json({
        transaction: result,
        cashCents: portfolio.cashCents,
        sharesUnits: portfolio.holdings[symbol]
    });
}));

app.post("/api/trades/sell", asyncRoute(async (req, res) => {
    const { symbol, sharesToSell } = req.body ?? {};
    if (typeof symbol !== "string" ||
        !/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol) ||
        !Number.isFinite(sharesToSell) ||
        sharesToSell <= 0) {
        return res.status(400).json({
            error: "Invalid Sell Request"
        });
    }

    const priceCents = await getStockPrice(symbol);
    const { result, portfolio } = await updatePortfolio(
        p => sellStock(p, symbol, sharesToSell, priceCents)
    );

    res.status(201).json({
        transaction: result,
        cashCents: portfolio.cashCents,
        sharesUnits: portfolio.holdings[symbol]
    });
}));

app.use((error, req, res, next) => {
    console.error(error);

    if (res.headersSent) {
        return next(error);
    }

    if (error.status === 429) {
        return res.status(429).json({
            error: "Too many requests. Please try again later."
        });
    }

    if (error.name === "VersionError") {
        return res.status(409).json({
            error: "Portfolio changed. Please retry the transaction."
        });
    }

    if (error.name === "ValidationError") {
        return res.status(400).json({
            error: "Invalid request data"
        });
    }

    if (error.code === 11000) {
        return res.status(409).json({
            error: "A record with that information already exists"
        });
    }

    const message = error.message || "";

    const clientError =
        message.startsWith("Invalid") ||
        message.startsWith("Insufficient") ||
        message.startsWith("Investment Amount");

    res.status(clientError ? 400 : 500).json({
        error: clientError
            ? message
            : "An unexpected server error occurred"
    });
});


async function startServer() {
    try {
        await connectDatabase();

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`MyBread API listening on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error);
        process.exitCode = 1;
    }
}

if (require.main === module) {
    startServer();
}

module.exports = app;