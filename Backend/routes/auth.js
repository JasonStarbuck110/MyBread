const crypto = require('node:crypto');
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");
const StudentProgress = require("../models/StudentProgress");
const router = express.Router();
const { rateLimit } = require("express-rate-limit");
const { sendVerificationEmail, createVerificationToken } = require("../services/verificationEmail");
const {
    createPasswordResetToken,
    sendPasswordResetEmail,
    sendPasswordChangedNotice
} = require("../services/passwordResetEmail");
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        error: "Too many authentication attempts. Please try again later."
    }
});

const asyncRoute = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.post("/verify-email", authLimiter, asyncRoute(async (req, res) => {
    const token = req.body?.token;
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
        return res.status(400).json({
            error: "Invalid or expired verification link."
        });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const now = new Date();
    const user = await User.findOneAndUpdate(
        {
            emailVerificationRequired: true,
            emailVerifiedAt: null,
            emailVerificationTokenHash: tokenHash,
            emailVerificationExpiresAt: { $gt: now }
        },
        {
            $set: {
                emailVerifiedAt: now
            },
            $unset: {
                emailVerificationTokenHash: "",
                emailVerificationExpiresAt: ""
            }
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (!user) {
        return res.status(400).json({
            error: "Invalid or expired verification link."
        });
    }

    return res.json({
        message: "Email verified successfully. You can now log in."
    });
}));

router.post(
    "/resend-verification",
    authLimiter,
    asyncRoute(async (req, res) => {
        const { email } = req.body ?? {};
        if (
            typeof email !== "string" ||
            email.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ) {
            return res.status(400).json({
                error: "Enter a valid email address."
            });
        }

        const cleanEmail = email.trim().toLowerCase();
        const message ="If this email has a pending account, " + "a verification link will be sent.";
        const cooldown = new Date(Date.now() - 5 * 60 * 1000);
        const { token, tokenHash, expiresAt } =createVerificationToken();
        const user = await User.findOneAndUpdate(
            {
                email: cleanEmail,
                isActive: true,
                emailVerificationRequired: true,
                emailVerifiedAt: null,
                $or: [
                    { emailVerificationSentAt: null },
                    { emailVerificationSentAt: { $lte: cooldown } }
                ]
            },
            {
                $set: {
                    emailVerificationTokenHash: tokenHash,
                    emailVerificationExpiresAt: expiresAt,
                    emailVerificationSentAt: new Date()
                }
            },
            {
                new: true,
                projection: { _id: 1, email: 1 }
            }
        );

        if (user) {
            try {
                await sendVerificationEmail(user.email, token);

            } catch (error) {
                console.error(
                    "Verification resend failed:",
                    user._id,
                    error
                );

                await User.updateOne(
                    {
                        _id: user._id,
                        emailVerificationTokenHash: tokenHash
                    },
                    {
                        $unset: {
                            emailVerificationTokenHash: "",
                            emailVerificationExpiresAt: "",
                            emailVerificationSentAt: ""
                        }
                    }
                );
            }
        }

        return res.status(202).json({ message });
    })
);

router.post("/register", authLimiter, asyncRoute(async (req, res) => {
    const { name, email, password, role } = req.body ?? {};
    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        role !== "student"
    ) {
        return res.status(400).json({
            error: "Invalid Registration Details"
        });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (
        cleanName.length < 2 ||
        cleanName.length > 100 ||
        cleanEmail.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
        password.length < 12 ||
        password.length > 128
    ) {
        return res.status(400).json({
            error: "Name, email, or password does not meet requirements"
        });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
        return res.status(409).json({
            error: "An account with this email already exists"
        });
    }
    const {
        token,
        tokenHash,
        expiresAt
    } = createVerificationToken();
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        role,

        emailVerificationRequired: true,
        emailVerifiedAt: null,
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: expiresAt
    });

    if (user.role === "student") {
    await StudentProgress.findOneAndUpdate(
        { studentId: user._id },
        { $setOnInsert: { studentId: user._id } },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
        }
    );
}

try {
    await sendVerificationEmail(user.email, token);
} catch (error) {
    console.error("Verification email failed for user:", user._id, error);

    return res.status(503).json({
        error:
            "Account created, but the verification email " +
            "could not be sent. Please request another link."
    });
}

user.emailVerificationSentAt = new Date();
await user.save();

    res.status(201).json({
        message: "Account created. Please verify your email.",
        requiresEmailVerification: true,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
}));

router.post("/forgot-password", authLimiter, asyncRoute(async (req, res) => {
    const email = req.body?.email;
    if (
        typeof email !== "string" ||
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
        return res.status(400).json({
            error: "Enter a valid email address."
        });
    }

    const cleanEmail = email.trim().toLowerCase();
    const message =
        "If an eligible account exists for this email, " +
        "a password reset link will be sent.";
    const cooldown = new Date(Date.now() - 5 * 60 * 1000);
    const { token, tokenHash, expiresAt } = createPasswordResetToken();
    const user = await User.findOneAndUpdate(
        {
            email: cleanEmail,
            isActive: true,
            passwordHash: { $exists: true },
            $and: [
                {
                    $or: [
                        { emailVerificationRequired: { $ne: true } },
                        { emailVerifiedAt: { $type: "date" } }
                    ]
                },
                {
                    $or: [
                        { passwordResetRequestedAt: null },
                        { passwordResetRequestedAt: { $lte: cooldown } }
                    ]
                }
            ]
        },
        {
            $set: {
                passwordResetTokenHash: tokenHash,
                passwordResetExpiresAt: expiresAt,
                passwordResetRequestedAt: new Date()
            }
        },
        {
            new: true,
            projection: { _id: 1, email: 1 }
        }
    );

    if (user) {
        try {
            await sendPasswordResetEmail(user.email, token);
        } catch (error) {
            console.error("Password reset email failed:", user._id, error);

            await User.updateOne(
                {
                    _id: user._id,
                    passwordResetTokenHash: tokenHash
                },
                {
                    $unset: {
                        passwordResetTokenHash: "",
                        passwordResetExpiresAt: "",
                        passwordResetRequestedAt: ""
                    }
                }
            );
        }
    }

    return res.status(202).json({ message });
}));

router.post("/reset-password", authLimiter, asyncRoute(async (req, res) => {
    const { token, password } = req.body ?? {};
    if (
        typeof token !== "string" ||
        !/^[a-f0-9]{64}$/i.test(token)
    ) {
        return res.status(400).json({
            error: "Invalid or expired password reset link."
        });
    }

    if (
        typeof password !== "string" ||
        password.length < 12 ||
        password.length > 128
    ) {
        return res.status(400).json({
            error: "Password must be between 12 and 128 characters."
        });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.findOneAndUpdate(
        {
            passwordResetTokenHash: tokenHash,
            passwordResetExpiresAt: { $gt: new Date() },
            isActive: true
        },
        {
            $set: {
                passwordHash
            },
            $unset: {
                passwordResetTokenHash: "",
                passwordResetExpiresAt: "",
                passwordResetRequestedAt: ""
            },
            $inc: {
                tokenVersion: 1
            }
        },
        {
            new: true,
            runValidators: true,
            projection: { _id: 1, email: 1 }
        }
    );

    if (!user) {
        return res.status(400).json({
            error: "Invalid or expired password reset link."
        });
    }

    try {
        await sendPasswordChangedNotice(user.email);
    } catch (error) {
        console.error("Password change notification failed:", error);
    }

    return res.json({
        message: "Password updated successfully. You can now log in."
    });
}));

router.post("/login", authLimiter, asyncRoute(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (
        typeof email !== "string" ||
        typeof password !== "string"
    ) {
        return res.status(400).json({
            error: "Email and password are required"
        });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({
        email: cleanEmail
    }).select("+passwordHash");
    if (!user || !user.isActive) {
        return res.status(401).json({
            error: "Invalid email or password"
        });
    }

    const passwordMatches = await bcrypt.compare(
        password,
        user.passwordHash
    );
    if (!passwordMatches) {
        return res.status(401).json({
            error: "Invalid email or password"
        });
    }

    if (user.emailVerificationRequired && !user.emailVerifiedAt) {
        return res.status(403).json({
            error: "Please verify your email address before logging in.",
            requiresEmailVerification: true
        });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
        {
            userId: user._id.toString(),
            tokenVersion: user.tokenVersion ?? 0
        },
        secret,
        { expiresIn: "1d" }
    );

    res.json({
        message: "Login successful",
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
}));

router.get("/me", authenticateToken, asyncRoute(async (req, res) => {
    var progress = null;

    if (req.user.role === "student") {
        progress = await StudentProgress.findOneAndUpdate(
            { studentId: req.user.id },
            { $setOnInsert: { studentId: req.user.id } },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );
    }

    res.json({
        user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        },
        progress
    });
}));

module.exports = router;