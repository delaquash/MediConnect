import express from "express";
import { handlePaymentWebhook, initializePayment, verifyPayment} from "../controllers/paymentController";
import authUser from "../middlewares/authUser";

const paymentRouter = express.Router();


paymentRouter.post('/verify-payment', authUser, verifyPayment);

paymentRouter.post('/paystack-webhook', handlePaymentWebhook);


export default paymentRouter