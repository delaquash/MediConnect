"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const doctorController_1 = require("../controllers/doctorController");
const docAuth_1 = __importDefault(require("../middlewares/docAuth"));
const doctorRouter = express_1.default.Router();
doctorRouter.get("/list", doctorController_1.doctorList);
doctorRouter.post("/login", doctorController_1.loginDoctor);
doctorRouter.get("/appointments", docAuth_1.default, doctorController_1.getDoctorAppointments);
doctorRouter.post("/complete-appointment", docAuth_1.default, doctorController_1.appointmentComplete);
doctorRouter.post("/cancel-appointment", docAuth_1.default, doctorController_1.doctorCancelAppointment);
doctorRouter.get("/dashboard", docAuth_1.default, doctorController_1.doctorsDashboard);
doctorRouter.get("/profile", docAuth_1.default, doctorController_1.getDoctorProfile);
doctorRouter.post("/update-profile", docAuth_1.default, doctorController_1.updateDoctorProfile);
exports.default = doctorRouter;
