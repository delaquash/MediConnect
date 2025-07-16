import express from "express";
import {
  addDoctor,
  allDoctors,
  loginAdmin,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard,
} from "../controllers/adminController";
// import upload from "../middlewares/multer";
// import authAdmin from "../middlewares/authAdmin";
// import { changeAvailability } from "../controllers/doctorController";

const adminRouter = express.Router();

adminRouter.post("/add-doctor", authAdmin, upload.single("image"), addDoctor);
adminRouter.post("/login", loginAdmin);
adminRouter.post("/all-doctors", authAdmin, allDoctors);
adminRouter.post("/change-availability", authAdmin, changeAvailability);
adminRouter.get("/appointments", authAdmin, appointmentsAdmin);
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel);
adminRouter.get("/dashboard", authAdmin, adminDashboard);

export default adminRouter;