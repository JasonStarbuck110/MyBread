const mongoose = require("mongoose");
const submissionSchema = new mongoose.Schema(
    {
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assignment",
            required: true
        },

        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        fileIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "File"
        }],

        textResponse: {
            type: String,
            trim: true,
            maxlength: 20000,
            default: ""
        },

        submittedAt: {
            type: Date,
            default: Date.now
        },

        status: {
            type: String,
            enum: ["submitted", "graded", "returned"],
            default: "submitted"
        },

        grade: {
            type: Number,
            min: 0,
            default: null
        },

        feedback: {
            type: String,
            trim: true,
            maxlength: 5000,
            default: ""
        },

        isLate: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        collection: "submissions"
    }
);

submissionSchema.index(
    { assignmentId: 1, studentId: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "Submission",
    submissionSchema
);