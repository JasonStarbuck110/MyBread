const mongoose = require("mongoose");
const lessonCompletionSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        lessonId: {
            type: String,
            required: true,
            trim: true
        },

        completedAt: {
            type: Date,
            default: Date.now
        },

        expAwarded: {
            type: Number,
            required: true,
            min: 0,
            validate: Number.isSafeInteger
        }
    },
    {
        timestamps: true,
        collection: "lesson_completions"
    }
);

lessonCompletionSchema.index(
    { studentId: 1, lessonId: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "LessonCompletion",
    lessonCompletionSchema
);