const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254
        },

        passwordHash: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: String,
            enum: ["student", "teacher", "admin"],
            default: "student",
            required: true
        },

        isActive: {
            type: Boolean,
            default: true
        },

        emailVerificationRequired: {
            type: Boolean,
            default: false
        },

        emailVerifiedAt: {
            type: Date,
            default: null
        },

        emailVerificationTokenHash: {
            type: String,
            select: false
        },

        emailVerificationExpiresAt: {
            type: Date,
            select: false
        },

        emailVerificationSentAt: {
            type: Date,
            select: false
        },

        tokenVersion: {
            type: Number,
            default: 0
        },

        passwordResetTokenHash: {
            type: String,
            select: false
        },

        passwordResetExpiresAt: {
            type: Date,
            select: false
        },

        passwordResetRequestedAt: {
            type: Date,
            select: false
        }
    },
    {
        timestamps: true,
        collection: "users"
    }
);

module.exports = mongoose.model("User", userSchema);