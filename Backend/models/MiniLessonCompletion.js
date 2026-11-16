const mongoose = require("mongoose");
const miniLessonCompletionSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    lessonId: {
        type: String,
        required: true
    },
    sectionIndex: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: Number.isInteger,
            message: "Section index must be a whole number"
        }
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
});

miniLessonCompletionSchema.index(
    { studentId: 1, lessonId: 1, sectionIndex: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "MiniLessonCompletion",
    miniLessonCompletionSchema
);