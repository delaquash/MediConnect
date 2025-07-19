import "dotenv/config";
import express, { Request, Response } from 'express';
import cors from "cors";
import connectDB from "./config/database";
import connectCloudinary from "./config/cloudinary";
import adminRouter from "./routes/adminRouter";
import doctorRouter from "./routes/doctorRoutes";
import userRouter from "./routes/userRoutes";

// app config
const app = express();
const port = process.env.PORT || 5000;

// ✅ Connect to services
connectDB();
connectCloudinary();

// ✅ Middlewares (CORS first, then body parsers)
app.use(cors()); // Move this up
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// ✅ API endpoints
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/doctor", doctorRouter);
app.use("/api/v1/user", userRouter); // Fix typo when you add this

app.get("/", (req: Request, res: Response) => {
  res.send("API WORKING");
});

app.listen(port, () => console.log("Server started", port));