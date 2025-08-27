"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken")); // Import JWT library for verifying token
// Admin authentication middleware
const authAdmin = async (req, res, next) => {
    try {
        const { atoken } = req.headers;
        if (!atoken) {
            res.status(401).json({
                success: false,
                message: "Not Authorized. Login Again",
            });
            return;
        }
        const adminEmail = process.env.ADMIN_EMAIL;
        const jwtSecret = process.env.JWT_SECRET;
        if (!adminEmail || !jwtSecret) {
            throw new Error("Admin credentials or JWT secret not configured");
        }
        // Decode the JWT token (it's now an object)
        const decoded = jsonwebtoken_1.default.verify(atoken, jwtSecret);
        // Check if the decoded token has the expected structure and email
        if (!decoded.email || decoded.email !== adminEmail || decoded.role !== 'admin') {
            res.status(401).json({
                success: false,
                message: "Not Authorized. Login Again",
            });
            return;
        }
        // All checks passed
        next();
    }
    catch (error) {
        console.error("Admin Auth Error:", error.message);
        res.status(401).json({
            success: false,
            message: "Not Authorized. Login Again"
        });
    }
};
exports.default = authAdmin; // Export middleware for use in routes
