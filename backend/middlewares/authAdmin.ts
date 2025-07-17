import { Request, Response, NextFunction } from "express"; // Importing types from Express
import jwt from "jsonwebtoken"; // Import JWT library for verifying token

// Admin authentication middleware
const authAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract the custom token "atoken" from request headers
    const { atoken } = req.headers as { atoken?: string };

    // If the token is not present, return unauthorized response
    if (!atoken) {
      res.status(401).json({
        success: false,
        message: "Not Authorized. Login Again",
      });
      return; // Exit early
    }

    // Load admin credentials and secret key from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET;

    // If any of the required env variables are missing, throw an error
    if (!adminEmail || !adminPassword || !jwtSecret) {
      throw new Error("Admin credentials or JWT secret not configured");
    }

    // Verify the JWT using the secret; decode the payload
    const token_decode = jwt.verify(atoken, jwtSecret) as string;

    // Expected token payload is a combination of admin email and password
    const expected = adminEmail + adminPassword;

    // If the decoded token payload doesn't match expected value, deny access
    if (token_decode !== expected) {
      res.status(401).json({
        success: false,
        message: "Not Authorized. Login Again",
      });
      return; // Exit early
    }

    // All checks passed, allow request to proceed
    next();
  } catch (error: any) {
    // Handle and log any errors
    console.error("Admin Auth Error:", error.message);
    res.status(401).json({ success: false, message: error.message });
  }
};

export default authAdmin; // Export middleware for use in routes
