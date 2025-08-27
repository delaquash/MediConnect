import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import DoctorModel from "../model/doctorModel";


interface JwtPayload {
  id: string;
  
}

export interface AuthenticatedDoctorRequest extends Request {
  docId?: string;           
  doctor?: any;         
}

const authDoctor = async (req: any | AuthenticatedDoctorRequest, res: Response, next: NextFunction) => {
  try {
    const { dtoken } = req.headers as { dtoken?: string };

    if (!dtoken) {
      res.status(401).json({
        success: false,
        message: "Not Authorized. Login Again",
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not defined in environment variables");
      res.status(500).json({
        success: false,
        message: "Server configuration error"
      });
      return;
    }
    
    const decoded = jwt.verify(dtoken, jwtSecret);
    
    if (typeof decoded === "object" && decoded !== null && "id" in decoded) {
      req.docId = (decoded as JwtPayload).id; 
      
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
      
      req.doctor = doctor;
      
      next();
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid token structure",
      });
      return;
    }
  } catch (error: any) {
    console.error("AuthDoctor Error:", error.message);
    
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

    res.status(401).json({
      success: false,
      message: "Authentication failed"
    });
  }
};


export default authDoctor;
