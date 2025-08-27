"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authUser_1 = __importDefault(require("../middlewares/authUser"));
const multer_1 = __importDefault(require("../middlewares/multer"));
const userRouter = express_1.default.Router();
userRouter.post("/register", userController_1.registerUser);
userRouter.post("/login", userController_1.loginUser);
userRouter.get("/get-profile", authUser_1.default, userController_1.getProfile);
userRouter.post("/update-profile", multer_1.default.single("image"), authUser_1.default, userController_1.updateProfile);
userRouter.post("/book-appointment", authUser_1.default, userController_1.bookAppointment);
userRouter.get("/appointments", authUser_1.default, userController_1.listAppointment);
userRouter.post("/cancel-appointment", authUser_1.default, userController_1.cancelAppointment);
exports.default = userRouter;
