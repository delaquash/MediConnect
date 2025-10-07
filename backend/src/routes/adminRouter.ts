import express from "express";
import {
  registerDoctor,
  allDoctors,
  loginAdmin,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard,
  changeAvailability,
  deleteDoctorByAdmin,
  deleteUserByAdmin,
  getAllUser
} from "../controllers/adminController";
import authAdmin from "../middlewares/authAdmin";
// import { seedInitialAdmin } from "../scripts/seedSystemAdmin";

const adminRouter = express.Router();
// adminRouter.post("/setup", seedInitialAdmin);

adminRouter.post("/add-doctor", registerDoctor);
adminRouter.get("/all-users", authAdmin, getAllUser);
adminRouter.post("/login", loginAdmin);
adminRouter.delete("/delete-doctor", authAdmin, deleteDoctorByAdmin);
adminRouter.delete("/delete-user", authAdmin, deleteUserByAdmin);
adminRouter.get("/all-doctors", authAdmin, allDoctors);
adminRouter.post("/change-availability", authAdmin, changeAvailability);
adminRouter.get("/appointments", authAdmin, appointmentsAdmin);
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel);
adminRouter.get("/dashboard", authAdmin, adminDashboard);

export default adminRouter;