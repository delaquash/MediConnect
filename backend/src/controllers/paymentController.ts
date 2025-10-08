import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import AppointmentModel from '../model/AppointmentModel';
import crypto from 'crypto';

export const initializePayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId
        const { appointmentId } = req.body;

        if(!appointmentId){
            res.status(400).json({
                success: false,
                message: "Appointment ID is required"
            })
            return;
        }

        const appointmentDetails = await AppointmentModel.findById(appointmentId).populate("userData")
        if(!appointmentDetails){
            res.status(404).json({
                success: false,
                message: "No appointment details found.."
            })
            return
        }

        // to know if appointment belong to the user
        if(appointmentDetails.userId.toString() !== userId){
            res.status(403).json({
                success: false,
                message: "User not authorized"
            })
            return
        }

        if(appointmentDetails.payment){
            res.status(400).json({
                success: false,
                message: "Appointment already paid"
            })
            return
        }

        // paystack function to init payment
        const response = await axios.post(
            "https://api.paystack.co/transaction/initialize",{
                email: appointmentDetails.userData.email,
                amount: appointmentDetails.amount* 100,
                currency: "NGN",
            }

        )
    } catch (error) {
        
    }
}
export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {}
export const handlePaymentWebhook = async (req: Request, res: Response, next: NextFunction) => {}

