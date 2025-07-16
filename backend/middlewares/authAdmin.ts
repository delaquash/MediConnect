import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Request to optionally include expected decoded string format
interface AdminTokenPayload {
  // You can also define this as { id: string } if using object payloads instead
  [key: string]: any;
}

// Admin authentication middleware
const authAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Destructure the token from request headers
    const { atoken } = req.headers as { atoken?: string };

    // If token is missing, deny access
    if (!atoken) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized. Login Again",
      });
    }

    // Ensure environment variables are defined
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminEmail || !adminPassword || !jwtSecret) {
      throw new Error("Admin credentials or JWT secret not configured");
    }

    // Decode the JWT
    const token_decode = jwt.verify(atoken, jwtSecret) as string;

    // Validate the token matches expected value (email + password)
    const expected = adminEmail + adminPassword;
    if (token_decode !== expected) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized. Login Again",
      });
    }

    // All checks passed — continue to next middleware
    next();
  } catch (error: any) {
    console.error("Admin Auth Error:", error.message);
    res.status(401).json({ success: false, message: error.message });
  }
};

export default authAdmin;
