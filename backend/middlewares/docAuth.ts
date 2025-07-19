import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Define the structure of the JWT payload
interface JwtPayload {
  id: string;
  // You can add more fields here if needed
}

// Doctor authentication middleware
const authDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract the doctor's token from headers
    const { dtoken } = req.headers as { dtoken?: string };

    // If no token is provided
    if (!dtoken) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized. Login Again",
      });
    }

    // Ensure JWT_SECRET is defined
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    // Verify token
    const decoded = jwt.verify(dtoken, jwtSecret);

    // Type guard: Ensure decoded is an object with an `id` property
    if (typeof decoded === "object" && "id" in decoded) {
      req.body.docId = (decoded as JwtPayload).id;
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid token structure",
      });
    }
  } catch (error: any) {
    console.error("AuthDoctor Error:", error.message);
    res.status(401).json({ success: false, message: error.message });
  }
};

export default authDoctor;
