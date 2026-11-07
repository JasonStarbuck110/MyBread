const mongoose = require("mongoose");

const expTransactionSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        amount: {
            type: Number,
            required: true,
            min: 1,
            validate: Number.isSafeInteger
        },

        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },

        sourceType: {
            type: String,
            enum: ["lesson", "quiz"],
            required: true
        },

        sourceId: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true,
        collection: "exp_transactions"
    }
);

// Prevents awarding EXP twice for the same activity.
expTransactionSchema.index(
    { studentId: 1, sourceType: 1, sourceId: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "ExpTransaction",
    expTransactionSchema
);