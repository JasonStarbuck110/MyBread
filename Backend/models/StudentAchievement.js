const mongoose = require("mongoose");

const studentAchievementSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        achievementId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Achievement",
            required: true
        },

        earnedAt: {
            type: Date,
            default: Date.now
        },

        bonusExpAwarded: {
            type: Number,
            default: 0,
            min: 0,
            validate: Number.isSafeInteger
        }
    },
    {
        timestamps: true,
        collection: "student_achievements"
    }
);

// Each achievement can only be earned once by each student.
studentAchievementSchema.index(
    { studentId: 1, achievementId: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "StudentAchievement",
    studentAchievementSchema
);