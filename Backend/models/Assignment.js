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