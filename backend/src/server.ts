import "dotenv/config";
import express, { Request, Response } from 'express';
import cors from "cors";
import connectDB from "./config/database";
import connectCloudinary from "./config/cloudinary";
import adminRouter from "./routes/adminRouter";
import doctorRouter from "./routes/doctorRoutes";
import userRouter from "./routes/userRoutes";
// import "./types/global"

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
app.use("/admin", adminRouter);
app.use("/doctor", doctorRouter);
app.use("/user", userRouter); 

app.get("/", (req: Request, res: Response) => {
  res.send("API WORKING");
});

app.listen(port, () => console.log("Server started", port));