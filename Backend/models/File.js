const mongoose = require("mongoose");
const fileSchema = new mongoose.Schema(
    {
        originalName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255
        },

        storageId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            unique: true
        },

        mimeType: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },

        sizeBytes: {
            type: Number,
            required: true,
            min: 1,
            validate: Number.isSafeInteger
        },

        uploadedBy: {
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
        }
    },
    {
        timestamps: true,
        collection: "files"
    }
);

module.exports = mongoose.model("File", fileSchema);