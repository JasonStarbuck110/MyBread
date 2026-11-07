const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "Authentication Required"
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                error: "Authentication Required"
            });
        }

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error("JWT_SECRET is not configured");
        }

        const decoded = jwt.verify(token, secret);

        const user = await User.findById(decoded.userId).select(
            "_id name email role isActive"
        );

        if (!user || !user.isActive) {
            return res.status(401).json({
                error: "Invalid or Inactive Account"
            });
        }

        req.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role
        };

        next();
    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                error: "Invalid or Expired Token"
            });
        }

        next(error);
    }
}

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: "Permission Denied"
            });
        }

        next();
    };
}

module.exports = {
    authenticateToken,
    requireRole
};