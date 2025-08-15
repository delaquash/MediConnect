import dotenv from "dotenv";
import express, { Request, Response } from 'express';
import cors from "cors";
import { connectDB } from "./config/database";
import connectCloudinary from "./config/cloudinary";
import adminRouter from "./routes/adminRouter";
import doctorRouter from "./routes/doctorRoutes";
import userRouter from "./routes/userRoutes";
import passwordRouter from "./routes/PasswordResetRoutes";
import EmailService from "./services/emailService";

// Load environment variables first
dotenv.config();

// app config
const app = express();
const port = process.env.PORT || 5000;

// Middlewares (CORS first, then body parsers)
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// API endpoints
app.use("/admin", adminRouter);
app.use("/doctor", doctorRouter);
app.use("/user", userRouter); 
app.use("/password", passwordRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("API WORKING");
});

// Email test endpoint
app.get("/test-email", async (req: Request, res: Response) => {
  try {
    // Test network connectivity
    await EmailService.testNetworkConnectivity();
    
    // Test email connection
    const isConnected = await EmailService.testConnection();
    
    if (isConnected && req.query.send === 'true' && req.query.to) {
      // Send test email if parameters provided
      const success = await EmailService.sendTestEmail(req.query.to as string);
      res.json({ 
        emailService: 'connected',
        testEmailSent: success,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({ 
        emailService: isConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message, 
      emailService: 'failed',
      timestamp: new Date().toISOString()
    });
  }
});


async function startServer() {
  try {
    // Connect to database
    await connectDB();
    console.log("Database connected");

    // Connect to Cloudinary
    connectCloudinary();
    console.log("Cloudinary connected");

    // Initialize email service (with error handling)
    try {
      await EmailService.initialize();
      console.log("Email service initialized");
    } catch (emailError:any) {
      console.warn("⚠️ Email service failed to initialize:", emailError.message);
      console.log("Server will continue without email functionality");
    }
    
    // Start Express server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();