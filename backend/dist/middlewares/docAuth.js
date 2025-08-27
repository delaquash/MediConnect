"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const doctorModel_1 = __importDefault(require("../model/doctorModel"));
// Doctor authentication middleware
const authDoctor = async (req, res, next) => {
    try {
        // Extract the doctor's token from headers
        const { dtoken } = req.headers;
        // If no token is provided
        if (!dtoken) {
            res.status(401).json({
                success: false,
                message: "Not Authorized. Login Again",
            });
            return;
        }
        // Ensure JWT_SECRET is defined
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            // Don't expose internal errors to client
            console.error("JWT_SECRET is not defined in environment variables");
            res.status(500).json({
                success: false,
                message: "Server configuration error"
            });
            return;
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(dtoken, jwtSecret);
        // Type guard: Ensure decoded is an object with an `id` property
        if (typeof decoded === "object" && decoded !== null && "id" in decoded) {
            // FIXED: Attach to req object, not req.body (security issue)
            req.docId = decoded.id; // Attach doctor ID to request object
            // Optional: Validate that the doctor still exists and is active
            const doctor = await doctorModel_1.default.findById(req.docId);
            if (!doctor) {
                res.status(401).json({
                    success: false,
                    message: "Doctor account not found"
                });
                return;
            }
            if (!doctor.available) {
                res.status(401).json({
                    success: false,
                    message: "Doctor account is deactivated"
                });
                return;
            }
            // Optional: Attach full doctor info for use in controllers
            req.doctor = doctor;
            next(); // Proceed to next middleware/controller
        }
        else {
            res.status(401).json({
                success: false,
                message: "Invalid token structure",
            });
            return;
        }
    }
    catch (error) {
        console.error("AuthDoctor Error:", error.message);
        // Handle specific JWT errors with appropriate messages
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({
                success: false,
                message: "Invalid token"
            });
            return;
        }
        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                message: "Token expired. Please login again"
            });
            return;
        }
        // Generic error for unexpected issues
        res.status(401).json({
            success: false,
            message: "Authentication failed"
        });
    }
};
exports.default = authDoctor;
