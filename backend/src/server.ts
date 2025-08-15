import dotenv from "dotenv";
import express, { Request, Response } from 'express';
import cors from "cors";
import {connectDB }from "./config/database";
import connectCloudinary from "./config/cloudinary";
import adminRouter from "./routes/adminRouter";
import doctorRouter from "./routes/doctorRoutes";
import userRouter from "./routes/userRoutes";
import EmailService from "./services/emailService";
dotenv.config();
// app config
const app = express();
const port = process.env.PORT || 5000;

// Connect to services
connectDB();
connectCloudinary();

//  Middlewares (CORS first, then body parsers)
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

//  API endpoints
app.use("/admin", adminRouter);
app.use("/doctor", doctorRouter);
app.use("/user", userRouter); 

app.get("/", (req: Request, res: Response) => {
  res.send("API WORKING");
});

app.listen(port, () => console.log("Server started", port));

async function startServer() {
  try {
    // Initialize email service when app starts
    await EmailService.initialize();
    
    // Start your Express server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();