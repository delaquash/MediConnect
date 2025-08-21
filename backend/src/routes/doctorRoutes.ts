import express from "express";
import {
  loginDoctor,
  appointmentComplete,
  doctorCancelAppointment,
  getDoctorAppointments,
  doctorList,
  doctorsDashboard,
  getDoctorProfile,
  updateDoctorProfile
} from "../controllers/doctorController";
import authDoctor from "../middlewares/docAuth";
import { checkDoctorProfileComplete } from "../middlewares/checkDoctorProfileComplete";
import { verifyDoctorOTP } from "../otpVerification/VerifyDocOtp";
import { requestDoctorPasswordReset, resetDoctorPassword, resendVerificationOTP} from "../controllers/PasswordResetController"

const doctorRouter = express.Router();

doctorRouter.get("/list", authDoctor, checkDoctorProfileComplete, doctorList);
doctorRouter.post("/verify-otp", verifyDoctorOTP)
doctorRouter.post("/login", loginDoctor);
doctorRouter.get("/appointments", authDoctor, checkDoctorProfileComplete, getDoctorAppointments);
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete);
doctorRouter.post("/cancel-appointment", authDoctor, checkDoctorProfileComplete, checkDoctorProfileComplete, doctorCancelAppointment);
doctorRouter.get("/dashboard", authDoctor, doctorsDashboard);
doctorRouter.get("/profile", authDoctor, getDoctorProfile);
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile);
doctorRouter.post("/request-password-reset", requestDoctorPasswordReset);
doctorRouter.post("/reset-password", resetDoctorPassword);
doctorRouter.post("/resend-verification-otp", authDoctor, resendVerificationOTP);


export default doctorRouter;