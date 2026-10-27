const { default: mongoose } = require("mongoose");
const positiveInteger = {validator: value => Number.isSafeInteger(value) && value > 0, message: "Must Be A Positive Integer"};
const nonnegativeInteger = {validator: value => Number.isSafeInteger(value) && value >= 0, message: "Must be a nonnegative integer"};
const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["BUY", "SELL"],
        required: true
    },

    symbol: {
        type: String,
        required: true
    },

    sharesUnits: {
        type: Number,
        required: true,
        validate: positiveInteger
    },

    priceCents: {
        type: Number,
        required: true,
        validate: positiveInteger
    },

    amountCents: {
        type: Number,
        required: true,
        validate: positiveInteger
    },

    timestamp: {
        type: String,
        required: true
    }
}, { _id: false });

const rewardSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    amountCents: {
        type: Number,
        required: true,
        validate: positiveInteger
    },
    earnedAt: {
        type: String,
        required: true
    }
}, { _id: false });

const portfolioSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        unique: true,
        immutable: true
    },

    cashCents: {
        type: Number,
        default: 0,
        validate: nonnegativeInteger
    },

    holdings: {
        type: Map,
        of: {
            type: Number,
            validate: nonnegativeInteger
        },
        default: () => new Map()
    },

    transactions: {
        type: [transactionSchema],
        default: []
    },

    rewardHistory: {
        type: [rewardSchema],
        default: []
    }
}, {
    timestamps: true,
    optimisticConcurrency: true,
    collection: "trading_portfolios"
});

module.exports = mongoose.model("TradingPortfolio", portfolioSchema);
