import express from "express";
import { handlePaymentWebhook, initializePayment, verifyPayment} from "../controllers/paymentController";
import authUser from "../middlewares/authUser";

const paymentRouter = express.Router();

paymentRouter.post('/initialize-paystack', authUser, initializePayment);
paymentRouter.post('/verify-paystack', authUser, verifyPayment);

paymentRouter.post('/paystack-webhook', handlePaymentWebhook);


export default paymentRouter