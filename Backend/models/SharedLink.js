const mongoose = require("mongoose");

const sharedLinkSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },

        url: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2048
        },

        description: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: ""
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            default: null,
            index: true
        },

        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assignment",
            default: null,
            index: true
        },

        visibility: {
            type: String,
            enum: ["private", "class"],
            default: "private"
        }
    },
    {
        timestamps: true,
        collection: "shared_links"
    }
);

module.exports = mongoose.model("SharedLink", sharedLinkSchema);