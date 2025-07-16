import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Define the structure of expected token payload
interface JwtPayload {
  id: string;
  // add more fields if needed
}

// User authentication middleware
const authUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Destructure token from request headers
    const { token } = req.headers as { token?: string };

    // If no token provided, deny access
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized. Login Again",
      });
    }

    // Ensure secret is defined
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET not defined in environment variables");
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret);

    // Check that decoded is a JwtPayload (an object with an `id` key)
    if (typeof decoded === "object" && "id" in decoded) {
      req.body.userId = (decoded as JwtPayload).id;
      next(); // Move to next middleware or route handler
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload structure",
      });
    }
  } catch (error: any) {
    console.error("AuthUser Error:", error.message);
    res.status(401).json({ success: false, message: error.message });
  }
};

export default authUser;
