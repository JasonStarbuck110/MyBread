const mongoose = require("mongoose");

const studentProgressSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        totalExp: {
            type: Number,
            default: 0,
            min: 0,
            validate: Number.isSafeInteger
        },

        level: {
            type: Number,
            default: 1,
            min: 1,
            validate: Number.isSafeInteger
        },

        currentStreak: {
            type: Number,
            default: 0,
            min: 0,
            validate: Number.isSafeInteger
        },

        longestStreak: {
            type: Number,
            default: 0,
            min: 0,
            validate: Number.isSafeInteger
        },

        lastActivityAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        collection: "student_progress"
    }
);

module.exports = mongoose.model(
    "StudentProgress",
    studentProgressSchema
);