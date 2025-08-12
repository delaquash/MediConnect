import { NextFunction, Request, Response } from 'express';
import DoctorModel, { IDoctor } from '../model/doctorModel';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import AppointmentModel from '../model/appointmentModel';
import mongoose from 'mongoose';
import UserModel from '../model/userModel';
import appointmentModel from '../model/appointmentModel';

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

        if(process.env.ADMIN_EMAIL !== email || process.env.ADMIN_PASSWORD !== password) {
            res.status(401).json({ success: false, message: "Invalid email or password" });
            return;
        }
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
    
    try {
        const doctors = await DoctorModel.find({}).select("-password").sort({ date: -1 })
        
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
        .find({})  
        .populate("userId", "name, phone, email, dob") 
        .populate("docId", "name, phone, specialty")
        .sort({ date: -1 })  
    res.status(200).json({ 
      success: true, 
      adminAppointment 
    });

  } catch (error: any) {
    console.error("Admin appointments error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
}
}

const appointmentCancel = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
        const session = await mongoose.startSession();
    try {
       
        const { appointmentId, cancellationReason } = req.body

        if(!appointmentId){
            res.status(400).json({
                success: false,
                message: "Appointment ID is required"
            })
            return;
        }
      if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid appointment ID format"
        });
        return;
      }
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
      
      if (appointment.cancelled) {
        res.status(400).json({
          success: false,
          message: "Appointment is already cancelled"
        });
        return;
      }

      const appointmentUpdate = await AppointmentModel.findByIdAndUpdate(
        appointmentId, 
        {
            cancelled: true,
            cancelledBy: "admin",
            cancellationReason: cancellationReason || 'Cancelled by admin', 
            cancelledAt: new Date() 
        },
        { session, new: true } 
      )

   
      const doctor = await DoctorModel.findById(appointment.docId._id).session(session);
      if (doctor) {
        
        const updatedSlots = { ...doctor.slots_booked };
        
        const dateSlots = updatedSlots[appointment.slotDate] || [];
        
        updatedSlots[appointment.slotDate] = dateSlots.filter((slot: string) => slot !== appointment.slotTime);

        if (updatedSlots[appointment.slotDate].length === 0) {
          delete updatedSlots[appointment.slotDate];
        }
        
        await DoctorModel.findByIdAndUpdate(
          appointment.docId._id,
          { slots_booked: updatedSlots },
          { session } 
        );
      }

      res.status(200).json({
        success: true,
        message: "Appointment cancelled successfully by admin",
        data: {
          appointmentId: appointmentUpdate?.id, // ID of the cancelled appointment
          cancellationDetails: {
            cancelledBy: 'admin', 
            cancelledAt: appointmentUpdate?.cancelledAt, 
            reason: appointmentUpdate?.cancellationReason 
          },
          affectedParties: {
            patient: appointment.userId?.name, 
            doctor: appointment.docId.name 
          },
          slotFreed: {
            date: appointment.slotDate, 
            time: appointment.slotTime 
          }
        }
      });
    ;
    
  } catch (error: any) {

    console.error("Admin cancel appointment error:", error);
    
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: "Validation error: Please check your input data"
      });
      return;
    }
    
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: "Invalid ID format"
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to cancel appointment"
    });
    
  } finally {
    await session.endSession();

  }
   
}

const adminDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
    
    const [doctors, users, appointments] = await Promise.all([
      DoctorModel.find({}), 
      UserModel.find({}),  
      appointmentModel.find({}) 
        .populate('userId', 'name email phone') 
        .populate('docId', 'name speciality') 
        .sort({ date: -1 }) 
    ]);

    let totalRevenue = 0;
    appointments.forEach((appointment) => {
      if (appointment.isCompleted || appointment.payment) {
        totalRevenue += appointment.amount; 
      }
    });

    // Filter appointments by status for better dashboard metrics
    const completedAppointments = appointments.filter(apt => apt.isCompleted); 
    const cancelledAppointments = appointments.filter(apt => apt.cancelled); 
    const pendingAppointments = appointments.filter(apt => !apt.isCompleted && !apt.cancelled); 

    const today = new Date().toISOString().split('T')[0]; 
    const todaysAppointments = appointments.filter(apt => apt.slotDate === today && !apt.cancelled);

    const latestAppointments = appointments
      .slice(0, 5) 
      .map(apt => ({
        appointmentId: apt._id,
        patientName: apt.userData?.name || 'Unknown Patient', 
        doctorName: apt.docId?.name || 'Unknown Doctor', 
        doctorSpeciality: apt.docId?.speciality || 'N/A',
        appointmentDate: apt.slotDate,
        appointmentTime: apt.slotTime,
        amount: apt.amount,
        status: apt.isCompleted ? 'completed' : apt.cancelled ? 'cancelled' : 'pending', 
        paymentStatus: apt.payment ? 'paid' : 'pending' 
      }));


    const uniquePatients = new Set<string>();
    appointments.forEach((appointment) => {
      uniquePatients.add(appointment.userId.toString()); 
    });


    const dashData = {
      totalDoctors: doctors.length,
      totalPatients: users.length, 
      totalAppointments: appointments.length,
      uniquePatients: uniquePatients.size, 
      
      totalRevenue,
    
      appointmentStats: {
        completed: completedAppointments.length,
        cancelled: cancelledAppointments.length,
        pending: pendingAppointments.length,
        today: todaysAppointments.length
      },
      
      // Recent activity for quick admin overview
      latestAppointments,
      
      // Quick stats for admin decision making
      doctorAvailability: {
        availableDoctors: doctors.filter(doc => doc.available).length, 
        unavailableDoctors: doctors.filter(doc => !doc.available).length 
      }
    };

    res.status(200).json({ 
      success: true, 
      message: "Admin dashboard data retrieved successfully",
      dashData 
    });

  } catch (error: any) {
    console.error("Admin dashboard error:", error);

    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: "Invalid data format in database query"
      });
      return;
    }

    res.status(500).json({ 
      success: false, 
      message: "Failed to load dashboard data" 
    });
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