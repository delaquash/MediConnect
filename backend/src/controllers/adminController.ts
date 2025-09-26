import { NextFunction, Request, Response } from 'express';
import DoctorModel from '../model/doctorModel';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import AppointmentModel from '../model/appointmentModel';
import mongoose from 'mongoose';
import UserModel from '../model/userModel';
import { createOTp } from '../utils/token';
import EmailService from '../services/emailService';
import AdminModel from '../model/adminModel';


const registerDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email, and password are required"
      });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!validator.isEmail(trimmedEmail)) {
      res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
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
        success: false,
        message: "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and symbols",
      });
      return;
    }

    const existingDoctor = await DoctorModel.findOne({ email: trimmedEmail });

    // If doctor exists and is verified, reject registration
    if (existingDoctor && existingDoctor.isEmailVerified) {
      res.status(409).json({
        success: false,
        message: "Doctor already exists with this email. Please login instead."
      });
      return;
    }

    const { otp, hash: otpHash } = createOTp(6);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); 

    let doctor;

    if (existingDoctor && !existingDoctor.isEmailVerified) {
      existingDoctor.name = name.trim();
      existingDoctor.password = password.trim();
      existingDoctor.emailVerificationToken = otpHash;  
      existingDoctor.emailVerificationOTPExpires = otpExpiry;
      existingDoctor.isEmailVerified = false;  
      existingDoctor.updatedAt = new Date();

      doctor = await existingDoctor.save();
    } else {
      doctor = new DoctorModel({
        name: name.trim(),
        email: trimmedEmail,
        password: password.trim(),
        image: null,
        specialty: null,
        degree: null,
        experience: null,
        about: null,
        fees: null,
        address: null,
        available: true,
        isEmailVerified: false,
        emailVerificationToken: otpHash,
        emailVerificationOTPExpires: otpExpiry,
        profileComplete: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await doctor.save();
    }
    
    const emailSent = await EmailService.sendVerificationOTP(
        trimmedEmail,
        otp,
        "doctor"
      );

    try {   
      if (!emailSent) {
        throw new Error('Email service returned false');
      }
    } catch (emailError) {
      // Clean up: delete doctor record if it's a new registration and email fails
      if (!existingDoctor) {
        await DoctorModel.findByIdAndDelete(doctor._id);
      }

      res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again."
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email for the verification code.",
      doctorId: doctor._id,
      email: trimmedEmail,
      name: name.trim()
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    next(error);
  }
};

// const loginAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   try {
//     const { email, password } = req.body;

//     // Validation
//     if (!email || !password) {
//       res.status(400).json({ 
//         success: false, 
//         message: "Email and password are required" 
//       });
//       return;
//     }

//     // Find admin by email (case-insensitive)
//     const admin = await AdminModel.findOne({ 
//       email: email.toLowerCase().trim() 
//     });

//     if (!admin) {
//       console.log(`Admin not found: ${email}`);
//       res.status(401).json({ 
//         success: false, 
//         message: "Invalid credentials" 
//       });
//       return;
//     }

//     // Check if admin is active
//     if (!admin.isActive) {
//       res.status(403).json({ 
//         success: false, 
//         message: "Admin account is deactivated" 
//       });
//       return;
//     }

//     // Compare password
//     const isMatch = await admin.comparePassword(password);
//     if (!isMatch) {
//       console.log(`Password mismatch for admin: ${email}`);
//       res.status(401).json({ 
//         success: false, 
//         message: "Invalid credentials" 
//       });
//       return;
//     }

//     // Update last login
//     admin.lastLogin = new Date();
//     await admin.save();

//     // Generate JWT token
//     const token = jwt.sign(
//       {
//         id: admin._id,
//         email: admin.email,
//         role: admin.role,
//         permissions: admin.permissions
//       },
//       process.env.JWT_SECRET!,
//       { expiresIn: "30d" }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Login successful",
//       token,
//       admin: {
//         id: admin._id,
//         name: admin.name,
//         email: admin.email,
//         role: admin.role,
//         permissions: admin.permissions
//       }
//     });

//   } catch (error) {
//     console.error('Login error:', error);
//     next(error);
//   }
// };

const loginAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt received');
    console.log('Email:', email);
    console.log('Password provided:', password ? 'Yes' : 'No');
    console.log('Password length:', password?.length);

    if (!email || !password) {
      console.log('❌ Missing email or password');
      res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
      return;
    }

    // Find admin with case-insensitive email
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Normalized email:', normalizedEmail);
    
    const admin = await AdminModel.findOne({ email: normalizedEmail });
    console.log('📋 Admin found:', !!admin);
    
    if (!admin) {
      console.log('❌ No admin found with email:', normalizedEmail);
      res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
      return;
    }

    console.log('🔑 Starting password comparison...');
    console.log('Stored hash:', admin.password.substring(0, 20) + '...');
    
    const isMatch = await admin.comparePassword(password);
    console.log('✅ Password comparison result:', isMatch);

    if (!isMatch) {
      console.log('❌ Password does not match');
      console.log('Input password:', password);
      res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
      return;
    }

    console.log('✅ Password matches! Generating token...');
    
    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET!,
      { expiresIn: "30d" }
    );

    console.log('🎉 Login successful for:', admin.email);
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
    });

  } catch (error) {
    console.error('💥 Login error:', error);
    next(error);
  }
};
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
    console.error("Database error:", error); // Add this
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

const appointmentCancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  try {

    const { appointmentId, cancellationReason } = req.body

    if (!appointmentId) {
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
      .populate("userId", "name, email, dob")
      .populate("docId", " name, specialty, email")
      .session(session); // Use the transaction session

    if (!appointment) {
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
      AppointmentModel.find({})
        .populate('userId', 'name email phone')
        .populate('docId', 'name speciality')
        .sort({ date: -1 })
    ]);

    let totalRevenue = 0;
    appointments.forEach((appointment) => {
      if (appointment.isCompleted || appointment.payment) {
        totalRevenue += appointment?.amount || 5000;
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

const changeAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {

        if (!req.body) {
            res.status(400).json({
                success: false,
                message: "Request body is required"
            });
            return;
        }

        const { docId } = req.body;
        
        
        if (!docId) {
            res.status(400).json({
                success: false,
                message: "Doctor ID (docId) is required"
            });
            return;
        }
  
        const doctor = await DoctorModel.findById(docId);
        
   
        if (!doctor) {
            res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
            return;
        }
        
 
        const newAvailability = !doctor.available;
        
        // Update doctor's availability
        await DoctorModel.findByIdAndUpdate(
            docId,
            { available: newAvailability },
            { new: true }
        );
        

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
export {
  registerDoctor,
  loginAdmin,
  allDoctors,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard,
  changeAvailability,
  // seedInitialAdmin
}