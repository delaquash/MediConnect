import express from "express";
import { loginDoctor, appointmentCancelDoctor, appointmentsDoctor, changeAvailability, doctorList, doctorsDashboard, doctorsProfile, updateDoctorProfile} from "../controllers/doctorController";
import docAuth from "../middlewares/docAuth";


const docRouter = express.Router();

docRouter.post("/")