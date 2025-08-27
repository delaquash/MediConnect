"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// User authentication middleware
const authUser = async (req, res, next) => {
    try {
        const { token } = req.headers;
        if (!token) {
            res.status(401).json({
                success: false,
                message: "Not Authorized. Login Again",
            });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({
                success: false,
                message: "Server configuration error",
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        if (typeof decoded === "object" && "id" in decoded) {
            req.userId = decoded.id;
            next();
        }
        else {
            res.status(401).json({
                success: false,
                message: "Invalid token payload structure",
            });
            return;
        }
    }
    catch (error) {
        console.error("AuthUser Error:", error.message);
        res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
        return;
    }
};
exports.default = authUser;
