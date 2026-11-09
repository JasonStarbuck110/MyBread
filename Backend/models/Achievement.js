const mongoose = require("mongoose");
const achievementSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            maxlength: 100
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },

        icon: {
            type: String,
            default: "trophy"
        },

        category: {
            type: String,
            enum: ["lessons", "quizzes", "exp", "streaks"],
            required: true
        },

        requirementType: {
            type: String,
            enum: [
                "lessons_completed",
                "quizzes_passed",
                "total_exp",
                "streak_days"
            ],
            required: true
        },

        requirementValue: {
            type: Number,
            required: true,
            min: 1,
            validate: Number.isSafeInteger
        },

        bonusExp: {
            type: Number,
            default: 0,
            min: 0,
            validate: Number.isSafeInteger
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        collection: "achievements"
    }
);

module.exports = mongoose.model(
    "Achievement",
    achievementSchema
);