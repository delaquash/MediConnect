import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
  userId?: string;
}


interface JwtPayload {
  id: string;
}


const authUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.headers as { token?: string };

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

    const decoded = jwt.verify(token, jwtSecret);

    if (typeof decoded === "object" && "id" in decoded) {
      req.userId = (decoded as JwtPayload).id;
      next();
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid token payload structure",
      });
      return;
    }
  } catch (error: any) {
    console.error("AuthUser Error:", error.message);
    res.status(401).json({ 
      success: false, 
      message: "Invalid or expired token" 
    });
    return;
  }
};

export default authUser;
