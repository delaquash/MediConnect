import "dotenv/config";
import express, {Request, Response } from 'express';
import cors  from "cors";
import connectDB from "./config/database";
import connectCloudinary from "./config/cloudinary";
import adminRouter from "./routes/adminRouter";

// app config
const app = express();
app.use(express.json()); // Parse JSON bodies

const port = process.env.PORT || 5000;
connectDB();
connectCloudinary();

// middlewares
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cors());

// api endpoints
app.use("/api/v1/admin", adminRouter);
// app.use("/api/doctor", doctorRouter);
// app.use("/api/ser", userRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("API WORKING");
});

app.listen(port, () => console.log("Server started", port));