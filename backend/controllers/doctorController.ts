import { NextFunction, Request, Response } from 'express';
import DoctorModel from '../model/doctorModel';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { isValidAppointmentDate } from '../utils/appointmentDate';
import {  isValidTimeSlot, generateTimeSlots } from '../utils/timeSlot';
import UserModel from '../model/userModel';

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
const appointmentsDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      // Start MongoDB session for transaction support (ensures data consistency)
  const session = await mongoose.startSession();

  try {
     // Execute all database operations within a transaction
    // If any operation fails, all changes are rolled back automatically
    await session.withTransaction(async () => {
      // Extract data from incoming HTTP request
      const authenticatedUserId = req.userId;   // User ID from authentication middleware
      const {docId, userId, slotDate, slotTime } = req.body; // Body of the request, can be used for additional data

    //   // Verify that authenticated user is booking for themselves (prevent unauthorized bookings)
    if(authenticatedUserId !== userId){
        res.status(403).json({
            success: false,
            message: "You can only book appointments for yourself"
        })
    }

      // Check if all required fields are provided
    if(!userId || !docId || !slotDate || !slotTime){
        res.status(400).json({
            success: false,
            message: "All fields are required"
        })
    }

     // Validate that user ID and doctor ID are valid MongoDB ObjectIds
     if(!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(docId)){
        res.status(400).json({
            success: false,
            message: "Invalid user or doctor ID"
        });
        return;                         // Reject invalid dates
     }

     // Validate appointment date (must be today or future, within 3 months)
     if(!isValidAppointmentDate(slotDate)){
        res.status(400).json({
            success: false,
            message: "Invalid appointment date. Must be today or within 3 months."
        });
        return;
     }

      // Validate time slot (must be within business hours and 30-minute intervals)
      if (!isValidTimeSlot(slotTime)) {
        res.status(400).json({
          success: false,
          message: "Invalid time slot. Please select a valid time between 9:00 AM and 5:00 PM"
        });
        return;                              // Reject invalid time slots
      }
     // Retrieve user document from database and include in transaction session  
     const user  = await UserModel.findById(userId).session(session)

     if(!user){
        res.status(404).json({
            success: false,
            message: "User not found"
        });
        return; // Stop further processing if user not found
     }

    //   Retrieve doctor document from database and include in transaction session  
    const doctor = await DoctorModel.findById(docId).session(session)

    if(!doctor){
        res.status(404).json({
            success: false,
            message: "Doctor not found"
        });
        return; // Stop further processing if doctor not found
    }

     // Check if doctor is currently accepting appointments
      if (!doctor.available) {
        res.status(400).json({               // 400 Bad Request for unavailable doctor
          success: false,
          message: "Doctor is currently unavailable for appointments"
        });
        return;                              // Cannot book with unavailable doctor
      }
      
    }) 
  } catch (error) {
    // Log error details for debugging purposes
    console.error("Book appointment error:", error);
    
    // Handle specific MongoDB validation errors
    if (error.name === 'ValidationError') {
      res.status(400).json({                 // 400 Bad Request for validation issues
        success: false,
        message: "Validation error: Please check your input data"
      });
      return;
    }
    
    // Handle MongoDB ObjectId casting errors
    if (error.name === 'CastError') {
      res.status(400).json({                 // 400 Bad Request for casting issues
        success: false,
        message: "Invalid ID format"
      });
      return;
    }
    
    // Pass unhandled errors to Express error middleware
    next(error);
  } finally {
    // Always end the MongoDB session to prevent memory leaks
    await session.endSession();
  }
}
const appointmentCancelDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {}
const doctorsDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {}
const doctorsProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {}
const updateDoctorProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {}

export {
    changeAvailability,
    doctorList,
    loginDoctor,
    appointmentsDoctor,
    appointmentCancelDoctor,
    doctorsDashboard,
    doctorsProfile,
    updateDoctorProfile
}