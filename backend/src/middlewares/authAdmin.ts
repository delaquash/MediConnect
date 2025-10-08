import { Request, Response, NextFunction } from "express"; 
import jwt from "jsonwebtoken"; 
import AdminModel from "../model/AdminModel";

const authAdmin = async (req: any, res: Response, next: NextFunction) => {
    try {

        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

        if (!token) {
            console.log('No token provided');
            res.status(401).json({
                success: false,
                message: "Access Denied! Admin not authorized"
            })
            return
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        if (decoded.role !== "system_admin") {
            console.log('Invalid role:', decoded.role);
            res.status(403).json({
                success: false,
                message: "Access Denied! System Admin privileges required"
            })
            return
        }

        const admin = await AdminModel.findById(decoded.id)
        if (!admin || !admin.isActive) {
            console.log('Admin not found or inactive');
            res.status(401).json({
                success: false,
                message: 'System admin not found or deactivated.'
            })
            return;
        }

        console.log('Admin authenticated:', admin.email);
        req.adminId = decoded.id;
        req.admin = admin;
        next();

    } catch (error: any) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format'
            });
        }

        if (error.name === 'TokenExpiredError') {
            console.log('Token expired at:', error.expiredAt);
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


export default authAdmin; 
