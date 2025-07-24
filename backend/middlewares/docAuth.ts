import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import DoctorModel from "../model/doctorModel";

// Define the structure of the JWT payload
interface JwtPayload {
  id: string;
  // You can add more fields here if needed
}
// TypeScript interface for authenticated doctor requests
export interface AuthenticatedDoctorRequest extends Request {
  docId: string;           // Doctor's ID from JWT token
  doctor?: any;            // Optional: Full doctor document
}
// Doctor authentication middleware
const authDoctor = async (req: any | AuthenticatedDoctorRequest, res: Response, next: NextFunction) => {
  try {
    // Extract the doctor's token from headers
    const { dtoken } = req.headers as { dtoken?: string };
    
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
    const decoded = jwt.verify(dtoken, jwtSecret);
    
    // Type guard: Ensure decoded is an object with an `id` property
    if (typeof decoded === "object" && decoded !== null && "id" in decoded) {
      // FIXED: Attach to req object, not req.body (security issue)
      req.docId = (decoded as JwtPayload).id; // Attach doctor ID to request object
      
      // Optional: Validate that the doctor still exists and is active
      const doctor = await DoctorModel.findById(req.docId);
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
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid token structure",
      });
      return;
    }
  } catch (error: any) {
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


export default authDoctor;
