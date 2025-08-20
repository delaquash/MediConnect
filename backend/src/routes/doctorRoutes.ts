import express from "express";
import { loginDoctor, 
    appointmentComplete, 
    doctorCancelAppointment, 
    getDoctorAppointments,
     changeAvailability, 
     doctorList,
      doctorsDashboard, 
      getDoctorProfile, 
      updateDoctorProfile
    } from "../controllers/doctorController";
import authDoctor from "../middlewares/docAuth";
import { checkDoctorProfileComplete } from "../middlewares/checkDoctorProfileComplete";

const doctorRouter = express.Router();

doctorRouter.get("/list", doctorList);
doctorRouter.post("/login", loginDoctor);
doctorRouter.get("/appointments", authDoctor, checkDoctorProfileComplete, getDoctorAppointments);
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete);
doctorRouter.post("/cancel-appointment", authDoctor, checkDoctorProfileComplete, doctorCancelAppointment);
doctorRouter.get("/dashboard", authDoctor, doctorsDashboard);
doctorRouter.get("/profile", authDoctor, getDoctorProfile);
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile);

export default doctorRouter;