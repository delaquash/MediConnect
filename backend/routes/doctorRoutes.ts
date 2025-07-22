import express from "express";
import { loginDoctor, appointmentCancelDoctor, appointmentsDoctor, changeAvailability, doctorList, doctorsDashboard, doctorsProfile, updateDoctorProfile} from "../controllers/doctorController";
import authDoctor from "../middlewares/docAuth";


const doctorRouter = express.Router();

doctorRouter.get("/list", doctorList);
doctorRouter.post("/login", loginDoctor);
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor);
// doctorRouter.post("/complete-appointment", docAuth, appointmentsDoctor);
// doctorRouter.post("/cancel-appointment", docAuth, appointmentCancelDoctor);
// doctorRouter.get("/dashboard", docAuth, doctorsDashboard);
// doctorRouter.get("/profile", docAuth, doctorsProfile);
// doctorRouter.post("/update-profile", docAuth, updateDoctorProfile);

export default doctorRouter; // Export the router for use in server setup   