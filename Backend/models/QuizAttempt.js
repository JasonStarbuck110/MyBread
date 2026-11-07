const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        quizId: {
            type: String,
            required: true,
            trim: true
        },

        score: {
            type: Number,
            required: true,
            min: 0,
            validate: Number.isSafeInteger
        },

        maxScore: {
            type: Number,
            required: true,
            min: 1,
            validate: Number.isSafeInteger
        },

        passed: {
            type: Boolean,
            required: true
        },

        expAwarded: {
            type: Number,
            required: true,
            min: 0,
            validate: Number.isSafeInteger
        },

        attemptNumber: {
            type: Number,
            required: true,
            min: 1,
            validate: Number.isSafeInteger
        },

        attemptedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,
        collection: "quiz_attempts"
    }
);

// Makes it possible to retrieve a student's attempts in order.
quizAttemptSchema.index(
    { studentId: 1, quizId: 1, attemptedAt: -1 }
);

module.exports = mongoose.model(
    "QuizAttempt",
    quizAttemptSchema
);