import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response } from 'express';
import cors from "cors";
import { connectDB } from "./config/database";
import adminRouter from "./routes/adminRouter";
import doctorRouter from "./routes/doctorRoutes";
import userRouter from "./routes/userRoutes";
import passwordRouter from "./routes/PasswordResetRoutes";
import EmailService from "./services/emailService";
import paymentRouter from "./routes/paymentRoutes";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

app.use("/admin", adminRouter);
app.use("/doctor", doctorRouter);
app.use("/user", userRouter); 
app.use("/password", passwordRouter);
app.use('/api/payment', paymentRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("API WORKING");
});

async function startServer() {
  try {
  
    await connectDB();
    console.log("Database connected");

    // Initialize email service (with error handling)
    try {
      await EmailService.initialize();

    } catch (emailError:any) {
      console.warn("⚠️ Email service failed to initialize:", emailError.message);
      console.log("Server will continue without email functionality");
    }
    
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();