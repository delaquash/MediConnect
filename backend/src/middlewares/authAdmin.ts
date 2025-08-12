import { Request, Response, NextFunction } from "express"; // Importing types from Express
import jwt from "jsonwebtoken"; // Import JWT library for verifying token

 const authAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { atoken } = req.headers as { atoken?: string };

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
        const decoded = jwt.verify(atoken, jwtSecret) as any;

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
    } catch (error: any) {
        console.error("Admin Auth Error:", error.message);
        res.status(401).json({ 
            success: false, 
            message: "Not Authorized. Login Again" 
        });
    }
};


export default authAdmin; // Export middleware for use in routes
