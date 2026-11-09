const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");
const StudentProgress = require("../models/StudentProgress");
const router = express.Router();
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,

    keyGenerator: (req) => {
        const ip = req.get("cf-connecting-ip") || req.ip;
        if (!ip) {
            const error = new Error("Client IP unavailable");
            error.status = 503;
            throw error;
        }

        return ipKeyGenerator(ip);
    },

    message: {
        error: "Too many authentication attempts. Please try again later."
    }
});

const asyncRoute = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

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

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        role
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

    res.status(201).json({
        message: "Account created successfully",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
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

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
        { userId: user._id.toString() },
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
    let progress = null;

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