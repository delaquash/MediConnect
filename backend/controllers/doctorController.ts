import { NextFunction, Request, Response } from 'express';
import DoctorModel from '../model/doctorModel';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { isValidAppointmentDate } from '../utils/appointmentDate';
import {  isValidTimeSlot, generateTimeSlots } from '../utils/timeSlot';
import UserModel from '../model/userModel';
import AppointmentModel from '../model/appointmentModel';

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
      // Get doctor's booked slots (object with dates as keys, time arrays as values)
      const doctorSlotsBooked = doctor.slots_booked || {};
      // Get already booked slots for the requested date (empty array if no bookings)
      const bookedSlotsForDate = doctorSlotsBooked[slotDate] || [];
      
      // Check if requested time slot is already booked
      if (bookedSlotsForDate.includes(slotTime)) {
        res.status(409).json({               // 409 Conflict status for booking collision
          success: false,
          message: "This time slot is already booked. Please select another time."
        });
        return;                              // Cannot double-book same slot
      }
    
      // Check for existing appointment with same parameters (prevent duplicate bookings)
     // Check for existing appointment with same parameters (prevent duplicate bookings)
      const existingAppointment = await AppointmentModel.findOne({
        userId,                              // Same user
        docId,                               // Same doctor
        slotDate,                            // Same date
        slotTime,                            // Same time
        cancelled: false                     // Only check non-cancelled appointments
      }).session(session);                   // Include in transaction
      
      // If duplicate appointment found, reject the request
      if (existingAppointment) {
        res.status(409).json({               // 409 Conflict for duplicate appointment
          success: false,
          message: "You already have an appointment with this doctor at this time"
        });
        return;                              // Prevent duplicate bookings
      }
      // Prepare appointment data object with all required information

      const appointmentData = {
        userId,                              // User ID from authenticated request
        docId,                               // Doctor ID from request body
        slotDate,                            // Date of the appointment
        slotTime,                            // Time of the appointment
        userData: {                           // User data to be stored in appointment
          name: user.name,                    // User's name
          email: user.email,                   // User's email
          phone: user.phone,                   // User's phone number
          address: user.address                // User's address
        },
        docData: {                            // Doctor data to be stored in appointment
          name: doctor.name,           // Doctor's name
          specialty: doctor.specialty,              // Doctor's specialty
          degree: doctor.degree,                  // Doctor's degree    
          fees: doctor.fees                     // Doctor's consultation fees
        },
        amount: doctor.fees,                  // Appointment fee based on doctor's fees
        date: Date.now(),                     // Current timestamp for appointment creation
        cancelled: false,                     // Initially not cancelled
        payment: false,                       // Initially not paid
        isCompleted: false                    // Initially not completed
      }


      // Create new appointment document with prepared data
      const newAppointment = new AppointmentModel(appointmentData);
      // Save appointment to database within transaction
      await newAppointment.save({ session });

      // Create copy of doctor's existing booked slots to avoid mutation
      const updatedBookedSlots = { ...doctorSlotsBooked };
      // If no slots exist for this date, initialize empty array
      if (!updatedBookedSlots[slotDate]) {
        updatedBookedSlots[slotDate] = [];
      }
      // Add the newly booked time slot to the date's array
      updatedBookedSlots[slotDate].push(slotTime);
      
      // Update doctor document with new booked slots within transaction
      await DoctorModel.findByIdAndUpdate(
        docId,                               // Find doctor by ID
        { slots_booked: updatedBookedSlots }, // Update slots_booked field
        { session }                          // Include in transaction
      );
      
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