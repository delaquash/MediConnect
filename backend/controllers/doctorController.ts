import { NextFunction, Request, Response } from 'express';
import DoctorModel from '../model/doctorModel';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import AppointmentModel from '../model/appointmentModel';
import { AuthenticatedRequest } from './userController';
import appointmentModel from '../model/appointmentModel';

const changeAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // ✅ Add safety check for req.body
        if (!req.body) {
            res.status(400).json({
                success: false,
                message: "Request body is required"
            });
            return;
        }

        const { docId } = req.body;
        
        // Validate that docId is provided
        if (!docId) {
            res.status(400).json({
                success: false,
                message: "Doctor ID (docId) is required"
            });
            return;
        }
        
        // Find doctor first to get current availability status
        const doctor = await DoctorModel.findById(docId);
        
        // Check if doctor exists
        if (!doctor) {
            res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
            return;
        }
        
        // Calculate new availability status
        const newAvailability = !doctor.available;
        
        // Update doctor's availability
        await DoctorModel.findByIdAndUpdate(
            docId,
            { available: newAvailability },
            { new: true }
        );
        
        // Send success response
        res.status(200).json({
            success: true,
            message: `Doctor availability ${newAvailability ? 'enabled' : 'disabled'} successfully`,
            data: { 
                docId: docId,
                available: newAvailability 
            }
        });
    } catch (error) {
        next(error);
    }
}
const doctorList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const doctors = await DoctorModel.find({}).select(["-password", "-email"]).sort({ date: -1 });
        res.status(200).json({
            success: true,
            message: "Doctors retrieved successfully",
            data: doctors
        });
    } catch (error) {
        next(error);
    }
}
const loginDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // ✅ Add safety check for req.body
        if (!req.body) {
            console.log(req.body); // Debug log
            res.status(400).json({
                success: false,
                message: "Request body is required"
            });
            return;
        }
        // Validate that email and password are provided
        const { email, password } = req.body

        if (!email || !password) {
            res.status(400).json({ success: false, message: "Email and password are required" });
            return;
        }
        const doctor = await DoctorModel.findOne({ email })

           if (!doctor) {
                 res.json({ success: false, message: "Invalid credentials" });
                 return;
           }

            const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET!, {
                expiresIn: "30d" })
    

           res.status(200).json({
                success: true,
                message: "Login successful",
               token
            });
    } catch (error) {
        next(error);
    }
}

const getDoctorAppointment = async (req: AuthenticatedRequest, res: Response) => {
  const doctorId = req.userId; // Assuming doctor is authenticated
  
  const appointments = await AppointmentModel.find({
    docId: doctorId,
    cancelled: false,
    slotDate: { $gte: new Date().toISOString().split('T')[0] } // Future dates
  }).populate('userId', 'name phone email');
  
    res.status(200).json({ 
        success: true, 
        data:appointments 
    });
};


    // Doctor cancellation function (missing from current code)
const doctorCancelAppointment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const doctorId = req.userId; // Authenticated doctor ID
      const { appointmentId, reason } = req.body;
      
      // Find appointment belonging to this doctor
      const appointment = await AppointmentModel.findOne({
        _id: appointmentId,
        docId: doctorId,           // Ensure doctor owns this appointment
        cancelled: false
      }).session(session);
      
      if (!appointment) {
        res.status(404).json({
          success: false,
          message: "Appointment not found"
        });
        return;
      }
      
      // Mark as cancelled with doctor reason
      await AppointmentModel.findByIdAndUpdate(
        appointmentId,
        { 
          cancelled: true,
          cancelledBy: 'doctor',    // Track who cancelled
          cancellationReason: reason
        },
        { session }
      );
      
      // Free up the time slot
      const doctor = await DoctorModel.findById(doctorId).session(session);
      const updatedSlots = { ...doctor?.slots_booked };
      const dateSlots = updatedSlots[appointment.slotDate] || [];
      updatedSlots[appointment.slotDate] = dateSlots.filter(slot => slot !== appointment.slotTime);
      
      await DoctorModel.findByIdAndUpdate(
        doctorId,
        { slots_booked: updatedSlots },
        { session }
      );
      
      // Send notification to patient about cancellation
      // sendCancellationNotification(appointment.userId, appointment, reason);
      
      res.json({
        success: true,
        message: "Appointment cancelled successfully"
      });
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }

}

const appointmentComplete = async(req: any, res: Response, next: NextFunction)=>{
    try {
        const  authenticatedDoctorId  = req.userId;
        const { appointmentId } = req.body;

        // validate appointment ID format
        if(!mongoose.Types.ObjectId.isValid(appointmentId)){
            res.status(400).json({
                success: false,
                message: "Invalid appointment ID"
            })
        }

        const appointmentData = await AppointmentModel.findById(appointmentId)

         if (!appointmentData) {
       res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
      return;
    }
     // Security: Only assigned doctor can complete
    if (appointmentData.docId.toString() !== authenticatedDoctorId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }
      // Check if already completed or cancelled
    if (appointmentData.isCompleted) {
      return res.status(400).json({
        success: false,
        message: "Appointment already completed"
      });
    }
    
    if (appointmentData.cancelled) {
      return res.status(400).json({
        success: false,
        message: "Cannot complete cancelled appointment"
      });
    }
    
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      isCompleted: true,
    });
    
    return res.status(200).json({
      success: true,
      message: "Appointment completed successfully"
    });
    } catch (error) {
        
    }
}
const doctorsDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {}
const doctorsProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {}
const updateDoctorProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {}

export {
    changeAvailability,
    doctorList,
    loginDoctor,
    getDoctorAppointment,
    doctorCancelAppointment,
    doctorsDashboard,
    doctorsProfile,
    updateDoctorProfile
}