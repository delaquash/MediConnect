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
// Add this to your server.ts for testing
app.post("/test-welcome", async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    console.log('🧪 Testing welcome email...');
    console.log('Email service ready?', EmailService.isReady());
    
    const result = await EmailService.sendWelcomeEmail(email, name, 'user');
    
    res.json({ 
      success: result,
      message: result ? 'Welcome email sent!' : 'Welcome email failed',
      emailServiceReady: EmailService.isReady()
    });
    
  } catch (error: any) {
    console.error('Test welcome email error:', error);
    res.status(500).json({ 
      error: error.message,
      success: false 
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