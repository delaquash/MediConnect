import express from "express";
import {
  loginDoctor,
  appointmentComplete,
  doctorCancelAppointment,
  getDoctorAppointments,
  doctorList,
  doctorsDashboard,
  getDoctorProfile,
  updateDoctorProfile,
  completeDoctorProfile,
} from "../controllers/doctorController";
import authDoctor from "../middlewares/docAuth";
import { checkDoctorProfileComplete } from "../middlewares/checkDoctorProfileComplete";
import { verifyDoctorOTP } from "../otpVerification/VerifyDocOtp";
import { requestDoctorPasswordReset, resetDoctorPassword, resendVerificationOTP} from "../controllers/PasswordResetController"
import upload from "../middlewares/multer";

const doctorRouter = express.Router();

doctorRouter.get("/list", authDoctor, doctorList);
doctorRouter.post("/verify-otp", verifyDoctorOTP)
doctorRouter.post("/login", loginDoctor);
doctorRouter.get("/appointments", authDoctor, checkDoctorProfileComplete, getDoctorAppointments);
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete);
doctorRouter.post("/cancel-appointment", authDoctor, checkDoctorProfileComplete, doctorCancelAppointment);
doctorRouter.get("/dashboard", authDoctor, doctorsDashboard);
doctorRouter.get("/profile", authDoctor, getDoctorProfile);
doctorRouter.post("/complete-doc-profile", authDoctor, upload.single("image"), completeDoctorProfile);
doctorRouter.put("/update-profile", authDoctor,upload.single("image"), updateDoctorProfile);


export default doctorRouter;