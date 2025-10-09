import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  completeProfile,
  getProfileStatus,
} from "../controllers/userController";
import authUser from "../middlewares/authUser";
import upload from "../middlewares/multer";
import { verifyUserOTP } from "../otpVerification/verifyOtp"
import { handlePaymentWebhook, initializePayment, verifyPayment } from "../controllers/paymentController";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/verify-otp", verifyUserOTP)
userRouter.post("/login", loginUser);

userRouter.get("/get-profile", authUser, getProfile);

userRouter.post("/book-appointment", authUser, bookAppointment);
userRouter.get("/appointments", authUser, listAppointment);
userRouter.post("/cancel-appointment", authUser, cancelAppointment);
userRouter.post('/complete-profile', authUser, upload.single('image'), completeProfile);
userRouter.put('/update-profile', authUser, upload.single('image'), updateProfile);
userRouter.get('/profile-status', authUser, getProfileStatus);
userRouter.post('/payment', authUser, initializePayment);
userRouter.post('/verify-payment', authUser, verifyPayment);

userRouter.post('/payment-webhook', handlePaymentWebhook);

export default userRouter;