const mongoose = require("mongoose");
const classSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },

        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        enrollmentCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },

        status: {
            type: String,
            enum: ["active", "archived"],
            default: "active"
        }
    },
    {
        timestamps: true,
        collection: "classes"
    }
);

module.exports = mongoose.model("Class", classSchema);