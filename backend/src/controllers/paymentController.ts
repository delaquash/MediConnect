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

        // Check if amount is defined
        if (typeof appointmentDetails.amount !== 'number') {
            res.status(400).json({
                success: false,
                message: "Appointment amount is missing or invalid"
            });
            return;
        }

        const reference = `APT_${appointmentId}_${Date.now()}`

        // paystack function to init payment
        const response = await axios.post(
            "https://api.paystack.co/transaction/initialize",{
                email: appointmentDetails.userData.email,
                amount: appointmentDetails.amount * 100,
                currency: "NGN",
                channel: ["card"],
                reference: reference,
                callback_url: `${process.env.FRONTEND_URL}/verify-payment`,
                metada: {
                    appointmentId: appointmentId,
                    userId: userId,
                    doctorName: appointmentDetails.docData.name,
                    patientName: appointmentDetails.userData.name,
                    slotDate: appointmentDetails.slotDate,
                    slotTime: appointmentDetails.slotTime,
                    custom_fields: [
                        {
                            display_name:"Appointment ID",
                            variable_name: "appointment_id",
                            value: appointmentId
                        },
                        {
                            display_name: "Patient Name",
                            variable_name: "patient_name",
                            value: appointmentDetails.userData.name
                        }
                    ]
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}`,
                    "Content0Type": "application/json",
                    "Cache-Control" : "no-cache"
                }
            }

        )
        
   if (response.data.status) {
      res.status(200).json({
        success: true,
        message: "Payment initialized successfully",
        authorization_url: response.data.data.authorization_url,
        access_code: response.data.data.access_code,
        reference: response.data.data.reference
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to initialize payment"
      });
    }

  } catch (error: any) {
    console.error('Paystack initialization error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || "Payment initialization failed"
    });
  }
};

export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const { reference } = req.body;

        if(!reference){
            res.status(400).json({
                success: false,
                message: "Payment reference is required"
            })
            return;
        }

        // verify payment
        const resp = await axios.get(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}`,
                    "Content0Type": "application/json",
                    "Cache-Control" : "no-cache"
                }
            }
        )

        const paymentData = resp.data.data

        if(!resp.data.status || paymentData.status !== "success"){
            res.status(400).json({
                success: false,
                message: "Payment verification failed"
            })
            return
        }

        let appointmentId: string

        if(paymentData.metadata && paymentData.metadata.appointmentId){
            appointmentId = paymentData.metadata.appointmentId
        } else {
            // extract metadata from reference
            const refParts = reference.split("_")
            if(refParts.length >=2){
                appointmentId = refParts[1]
            } else {
                res.status(400).json({
                    success: false,
                    message: "Invalid payment reference format"
                })
                return
            }
        }
        
        // verify if appointment belong to user
        const appointment = await AppointmentModel.findById(appointmentId)
      
        if (!appointment) {
            res.status(404).json({
                success: false,
                message: "Appointment not found"
        });
        return;
        }
        if(appointment.userId.toString() !== userId){
            res.status(403).json({
                success: false,
                message: "Unauthorized"
            })
            return;
        }

        // prevent double payment
        if(appointment.payment && appointment.paymentReference === reference){
            res.status(200).json({
                success: true,
                message:"Payment already verified",
                appointment
            })
            return
        }

        const updatedAppointment = await AppointmentModel.findByIdAndUpdate(
            appointmentId, 
            {
                payment: true,
                paymentMethod: "paystack",
                paymentReference: reference,
                paidAt: new Date()
            },
            { new: true }
        )

        if(!updatedAppointment){
                res.status(404).json({
                    success: false,
                    message: "Appointment not found"
                })
                return;
        }

        res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            appointment: updatedAppointment
        })  
    } catch (error: any) {
    console.error('Paystack verification error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || "Payment verification failed"
    });
  }
}

export const handlePaymentWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY!;
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment) {
      // Only validate in production
      const hash = crypto
        .createHmac('sha512', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      const paystackSignature = req.headers['x-paystack-signature'];

      if (hash !== paystackSignature) {
        console.error('Signature mismatch!');
        res.status(400).json({
          success: false,
          message: "Invalid signature"
        });
        return;
      }
    }

    const event = req.body;

    // Handle the event
    if (event.event === 'charge.success') {
      const { reference, status } = event.data;

      if (status === 'success') {
        // Extract appointmentId from reference
        const refParts = reference.split('_');
        const appointmentId = refParts.length >= 2 ? refParts[1] : null;

        if (appointmentId) {
          await AppointmentModel.findByIdAndUpdate(
            appointmentId,
            {
              payment: true,
              paymentMethod: 'paystack',
              paymentReference: reference,
              paidAt: new Date()
            }
          );
        }
      }
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ success: true });
  }
// try {
//     console.log('Webhook received:', req.body);
    
//     const event = req.body;

//     if (event.event === 'charge.success') {
//       const { reference, status } = event.data;
      
//       if (status === 'success') {
//         const refParts = reference.split('_');
//         const appointmentId = refParts[1];

//         await AppointmentModel.findByIdAndUpdate(appointmentId, {
//           payment: true,
//           paymentMethod: 'paystack',
//           paymentReference: reference,
//           paidAt: new Date()
//         });

//         console.log('✅ Payment confirmed for:', appointmentId);
//       }
//     }

//     res.status(200).json({ success: true });
//   } catch (error) {
//     console.error('Webhook error:', error);
//     res.status(200).jso console.log(appointment, "this is appointment")
}

