const mongoose = require("mongoose");
const assignmentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },

        instructions: {
            type: String,
            required: true,
            trim: true,
            maxlength: 10000
        },

        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            required: true,
            index: true
        },

        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        moduleId: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        },

        kind: {
            type: String,
            enum: ["module", "mini", "quiz"],
            default: null
        },

        sectionIndex: {
            type: Number,
            min: 0,
            max: 4,
            default: null
        },

        recipientType: {
            type: String,
            enum: ["class", "student"],
            default: "class"
        },

        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        rewardXp: {
            type: Number,
            min: 0,
            max: 100000,
            default: 0,
            validate: Number.isSafeInteger
        },

        rewardCashCents: {
            type: Number,
            min: 0,
            max: 10000000,
            default: 0,
            validate: Number.isSafeInteger
        },

        dueDate: {
            type: Date,
            default: null
        },

        status: {
            type: String,
            enum: ["draft", "published", "closed"],
            default: "draft"
        }
    },

    {
        timestamps: true,
        collection: "assignments"
    }
);

module.exports = mongoose.model(
    "Assignment",
    assignmentSchema
);