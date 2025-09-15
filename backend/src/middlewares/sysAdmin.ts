import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import AdminModel from "../model/adminModel"

declare global {
    namespace Request {
        req: any
    }
}

export const SystemAuth = async (req: any, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.token || req.headers.authorization?.replace('Bearers', '')
        if (!token) {
            res.status(401).json({
                success: false,
                message: "Access Denied! Admin not authorized"
            })
            return
        }

        const decoded = jwt.verify(token as any, process.env.JWT_SECRET!) as any;

        if (decoded.role !== "system_admin") {
            res.status(403).json({
                success: false,
                message: "Access Denied! System Admin priviledges required"
            })
            return
        }
        const admin = await AdminModel.findById(decoded.id)
        if (!admin || !admin.isActive) {
            res.status(401).json({
                success: false,
                message: 'System admin not found or deactivated.'
            })
            return;
        }
        req.adminId = decoded.id;
        req.admin = admin;
        next();

    } catch (error: any) {
        console.error('System admin authentication error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        });
    }
};