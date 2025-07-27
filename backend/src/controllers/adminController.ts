import { NextFunction, Request, Response } from 'express';
import DoctorModel, { IDoctor } from '../model/doctorModel';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import AppointmentModel from '../model/appointmentModel';
import mongoose from 'mongoose';

const addDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, email, password, image, specialty, degree, experience, about, available, fees, address, slots_booked } = req.body as IDoctor;
        
        if(!name || !email || !password || !image || !specialty || !degree || !experience || !about || !fees || !address || !slots_booked) {
            res.status(400).json({ message: "All fields are required" })
            return; 
        }

        if (!validator.isEmail(email)) {
            res.status(400).json({ message: "Invalid email format" })
            return; 
        }
        if (!validator.isStrongPassword(password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        })) {
            res.status(400).json({
                message: "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and symbols",
            });
            return; // 
        }
        let uploadedImage: string ;
        // ✅ Add file validation
         if (req.file) {
            // File upload - upload to Cloudinary
            const fileStr = `data:${req.file.mimetype};base64,${req?.file?.buffer?.toString('base64')}`;
            const result = await cloudinary.uploader.upload(fileStr, {
                folder: 'uploads',
                resource_type: 'auto',
            });
            uploadedImage = result.secure_url;
        } else if (image) {
            // Image URL provided
            uploadedImage = image;
        } else {
            res.status(400).json({ message: "Doctor image is required (either upload file or provide image URL)" });
            return;
        }

        const doctor = new DoctorModel({
            name,
            email,
            password,
            specialty,
            degree,
            experience,
            image: uploadedImage,
            about,
            available,
            fees,
            slots_booked,
            address,
            date: Date.now(),
        });

        const SavedDoctor = await doctor.save();
        res.status(201).json({ 
            status: "success",
            message: "Doctor added successfully", 
            data: SavedDoctor,
        });
    } catch (error: any) {
        next(error);
    } 
}

const loginAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validate credentials
        if(process.env.ADMIN_EMAIL !== email || process.env.ADMIN_PASSWORD !== password) {
            res.status(401).json({ success: false, message: "Invalid email or password" });
            return;
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                email: process.env.ADMIN_EMAIL, 
                role: 'admin',
                id: 'admin' 
            },
            process.env.JWT_SECRET!,
            { expiresIn: "30d" }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
        });
    } catch (error) {
        next(error);
    } 
}

const allDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    console.log("🔍 allDoctors route hit!"); // Add this line
    
    try {
        const doctors = await DoctorModel.find({}).select("-password").sort({ date: -1 });
        
        console.log("📊 Found doctors:", doctors.length); // Add this too
        
        res.status(200).json({
            success: true,
            message: doctors.length === 0 ? "No doctors found" : "Doctors retrieved successfully",
            data: doctors,
            count: doctors.length,
        });
    } catch (error) {
        console.error("❌ Database error:", error); // Add this
        next(error);
    }
}

const appointmentsAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const adminAppointment = await AppointmentModel
        .find({})  // this is to get all the information about the appointment
        .populate("userId", "name, phone, email, dob") // Get patient details such as name
        .populate("doctorId", "name, phone, specialty")
        .sort({ date: -1 })  // Sort by date  i.e latest date
        // Send successful response with all appointments data
    res.status(200).json({ 
      success: true, 
      adminAppointment // Return the appointments array directly
    });

  } catch (error: any) {
    // Log error details for debugging purposes
    console.error("Admin appointments error:", error);
    
    // Send error response to client with error message
    res.status(500).json({ 
      success: false, 
      message: error.message // Include actual error message for troubleshooting
    });
}
}
 const appointmentCancel = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
     // Start database transaction to ensure all operations succeed or fail together
        const session = await mongoose.startSession();
    try {
       
        const { appointmentId, cancellationReason } = req.body

        // check if an appointment ID was provided
        if(!appointmentId){
            res.status(400).json({
                success: false,
                message: "Appointment ID is required"
            })
            return;
        }

           // Validate that the appointment ID is a valid MongoDB ObjectId format
      if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid appointment ID format"
        });
        return;
      }

         // Find the appointment and populate patient and doctor details
         const appointment = await AppointmentModel
            .findById(appointmentId)
            .populate("userId","name, email, dob")
            .populate("docId", " name, specialty, email")
            .session(session); // Use the transaction session

        if(!appointment){
        res.status(404).json({
          success: false,
          message: "Appointment not found"
        });
        return;
      }
      
      // Prevent cancelling an appointment that's already been cancelled
      if (appointment.cancelled) {
        res.status(400).json({
          success: false,
          message: "Appointment is already cancelled"
        });
        return;
      }

      // STEP 1: Update the appointment record to mark it as cancelled
      const appointmentUpdate = await AppointmentModel.findByIdAndUpdate(
        appointmentId, 
        {
            cancelled: true,
            cancelledBy: "admin",
            cancellationReason: cancellationReason || 'Cancelled by admin', // Store reason or default message
            cancelledAt: new Date() // Record the exact time of cancellation
        },
        { session, new: true } // Use transaction and return updated document
      )

      // STEP 2: Free up the doctor's time slot so it becomes available again
      const doctor = await DoctorModel.findById(appointment.docId._id).session(session);
      if (doctor) {
        // Create a copy of the doctor's current booked slots
        const updatedSlots = { ...doctor.slots_booked };
        
        // Get the array of time slots for the appointment date
        const dateSlots = updatedSlots[appointment.slotDate] || [];
        
        // Remove the cancelled appointment's time slot from the array
        updatedSlots[appointment.slotDate] = dateSlots.filter((slot: string) => slot !== appointment.slotTime);
        
        // If no more slots exist for this date, remove the date entry completely
        if (updatedSlots[appointment.slotDate].length === 0) {
          delete updatedSlots[appointment.slotDate];
        }
        
        // Update the doctor's record with the freed-up slots
        await DoctorModel.findByIdAndUpdate(
          appointment.docId._id,
          { slots_booked: updatedSlots },
          { session } // Use the same transaction session
        );
      }
      // STEP 3: Send success response with comprehensive information about the cancellation
      res.status(200).json({
        success: true,
        message: "Appointment cancelled successfully by admin",
        data: {
          appointmentId: appointmentUpdate?.id, // ID of the cancelled appointment
          cancellationDetails: {
            cancelledBy: 'admin', // Who performed the cancellation
            cancelledAt: appointmentUpdate?.cancelledAt, // When it was cancelled
            reason: appointmentUpdate?.cancellationReason // Why it was cancelled
          },
          affectedParties: {
            patient: appointment.userId?.name, // Patient who was affected
            doctor: appointment.docId.name // Doctor who was affected
          },
          slotFreed: {
            date: appointment.slotDate, // Date that became available again
            time: appointment.slotTime // Time that became available again
          }
        }
      });
    ;
    
  } catch (error: any) {
    // Log the error for debugging purposes
    console.error("Admin cancel appointment error:", error);
    
    // Handle validation errors (invalid data format, missing required fields)
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: "Validation error: Please check your input data"
      });
      return;
    }
    
    // Handle database casting errors (invalid ObjectId format)
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: "Invalid ID format"
      });
      return;
    }
    
    // Generic error response for any other unexpected errors
    res.status(500).json({
      success: false,
      message: "Failed to cancel appointment"
    });
    
  } finally {
    // Always close the database session, whether operation succeeded or failed
    await session.endSession();

  }
   
}

const adminDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        
    } catch (error) {
        
    }
}

export  {
    addDoctor,
    loginAdmin,
    allDoctors,
    appointmentsAdmin,
    appointmentCancel,
    adminDashboard,
}