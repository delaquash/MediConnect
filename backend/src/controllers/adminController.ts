import mongoose from 'mongoose';
import { NextFunction, Request, Response } from 'express';
import DoctorModel from '../model/doctorModel';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import AppointmentModel from '../model/appointmentModel';
import UserModel from '../model/userModel';
import { createOTp } from '../utils/token';
import EmailService from '../services/emailService';
import AdminModel from '../model/adminModel';
import { v2 as cloudinary } from 'cloudinary';


const getAllUser= async(req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await UserModel.find({}).select("-password").sort({ date: -1 })

    res.status(200).json({
      success: true,
      message: users.length === 0 ? "No users found" : "Users retrieved successfully",
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error("Database error:", error); // Add this
    next(error);
    
  }
}

const registerDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      name, 
      email, 
      password, 
      specialty, 
      degree, 
      experience, 
      about, 
      fees, 
      address 
    } = req.body;
    
    const imageFile = req.file;

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

    if (existingDoctor && existingDoctor.isEmailVerified) {
      res.status(409).json({
        success: false,
        message: "Doctor already exists with this email. Please login instead."
      });
      return;
    }

    // Handle image upload to Cloudinary
    let imageUrl = null;
    if (imageFile) {
      try {
        const fileStr = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;
        
        const result = await cloudinary.uploader.upload(fileStr, {
          folder: 'doctors-profiles',
          resource_type: 'auto',
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good' }
          ]
        });
        
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error("❌ Image upload error:", uploadError);
        res.status(500).json({
          success: false,
          message: "Failed to upload profile image"
        });
        return;
      }
    }

    const { otp, hash: otpHash } = createOTp(6);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    let doctor;

    // Parse address if it's a string
    let addressData = null;
    if (address) {
      try {
        addressData = typeof address === 'string' ? JSON.parse(address) : address;
      } catch (e) {
        addressData = null;
      }
    }

    if (existingDoctor && !existingDoctor.isEmailVerified) {
      // Update existing unverified doctor with full profile
      existingDoctor.name = name.trim();
      existingDoctor.password = password.trim();
      existingDoctor.emailVerificationToken = otpHash;
      existingDoctor.emailVerificationOTPExpires = otpExpiry;
      existingDoctor.image = typeof imageUrl === 'string' ? imageUrl : undefined;
      existingDoctor.specialty = specialty || null;
      existingDoctor.degree = degree || null;
      existingDoctor.experience = experience || null;
      existingDoctor.about = about || null;
      existingDoctor.fees = fees || null;
      existingDoctor.address = addressData;
      existingDoctor.profileComplete = !!(specialty && degree && experience && about && fees && addressData);
      existingDoctor.updatedAt = new Date();

      doctor = await existingDoctor.save();
    } else {
      // Create new doctor with full profile
      doctor = new DoctorModel({
        name: name.trim(),
        email: trimmedEmail,
        password: password.trim(),
        image: imageUrl,
        specialty: specialty || null,
        degree: degree || null,
        experience: experience || null,
        about: about || null,
        fees: fees || null,
        address: addressData,
        available: true,
        isEmailVerified: false,
        emailVerificationToken: otpHash,
        emailVerificationOTPExpires: otpExpiry,
        profileComplete: !!(specialty && degree && experience && about && fees && addressData),
        profileCompletedAt: !!(specialty && degree && experience && about && fees && addressData) ? new Date() : null,
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

    if (!emailSent) {
      if (!existingDoctor) {
        await DoctorModel.findByIdAndDelete(doctor._id);
      }
      throw new Error('Email service failed');
    }

    res.status(201).json({
      success: true,
      message: "Doctor registered successfully! Please check your email for verification.",
      doctorId: doctor._id,
      email: trimmedEmail,
      name: name.trim(),
      image: doctor.image,
      profileComplete: doctor.profileComplete
    });

  } catch (error: any) {
    console.error('Doctor registration error:', error);
    next(error);
  }
};

const loginAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
      return;
    }

    // Find admin with case-insensitive email
    const normalizedEmail = email.toLowerCase().trim();
    
    const admin = await AdminModel.findOne({ email: normalizedEmail });
    
    if (!admin) {
      console.log('No admin found with email:', normalizedEmail);
      res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
      return;
    }

  
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {

      res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
      return;
    }
    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { 
        id: admin._id, 
        email: admin.email, 
        role: admin.role 
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
    console.error('Login error:', error);
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
      // .populate("userId", "name, phone, email, dob")
      // .populate("docId", "name, phone, specialty")
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
        // .populate('userId', 'name email phone')
        // .populate('docId', 'name speciality')
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

const deleteDoctorByAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
     const session = await mongoose.startSession();
  try {

    await session.startTransaction();

    const { doctorId } = req.body;

    if (!doctorId) {
      res.status(400).json({
        success: false,
        message: "Doctor ID is required"
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      res.status(400).json({
        success: false,
        message: "Invalid Doctor ID format"
      });
      return;
    }
    // check if doctor exist in db
    const doctor = await DoctorModel.findById(doctorId).session(session);  
    if(!doctor){
      res.status(404).json({
        success: false,
        message: "Doctor not found"
      })
      return;
    }
    // Also check if doctor has upcoming appointment that should be cancelled
    const upcomingAppointments = await AppointmentModel.find({
      docId: doctorId,
      slotDate:{
        $gte: new Date().toISOString().split("T")[0] //today or future
      },
      cancelled: false,
      isCompleted: false
    }).session(session)

    if(upcomingAppointments.length > 0) {
      res.status(400).json({
        success: false,
        message: "Cannot delete doctor with upcoming appointments. Cancel appointments first.",
        data: {
          upcomingAppointments: upcomingAppointments.length,
          nextAppointment: upcomingAppointments[0]?.slotDate
        }
      });
      return;
    }
    // Cancel all future appointment
    await AppointmentModel.updateMany(
      {
        docId: doctorId,
        slotDate: { $gte: new Date().toISOString().split('T')[0] },
        cancelled: false
      },
      {
        cancelled: true,
        cancelledBy: "admin",
        cancellationReason: "Doctor account deleted by admin",
        cancelledAt: new Date()
      },
      { session }
    );

        await DoctorModel.findByIdAndDelete(doctorId).session(session);


     await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Doctor deleted successfully",
      data: {
        doctorId: doctorId,
        doctorName: doctor.name,
        doctorEmail: doctor.email,
        deletedAt: new Date(),
        cancelledAppointments: upcomingAppointments.length
      }
    });

  } catch (error: any) {
    await session.abortTransaction();
    
    console.error("Delete doctor error:", error);

    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: "Invalid doctor ID format"
      });
      return;
    }

    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: "Validation error: " + error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete doctor",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });

  } finally {
    await session.endSession();
  }
};


const deleteUserByAdmin = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession()
  try {
    await session.startTransaction()

    const { userId } = req.body;
    if(!userId) {
      res.status(400).json({
        success: false,
        message: "User ID is required"
      })
      return
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        message: "Invalid Doctor ID format"
      });
      return;
    }

    const user = await UserModel.findById(userId).session(session)
    if(!user){
      res.status(404).json({
        success: false,
        message: "User not found"
      })
      return
    }

    // check if user has a future appointment
    const UserUpcomingAppointment = await AppointmentModel.find({
      userID: userId,
        slotDate:{
        $gte: new Date().toISOString().split("T")[0] //today or future
      },
      cancelled: false,
      isCompleted: false
    }).session(session)
    
    if(UserUpcomingAppointment.length > 0){
        res.status(400).json({
        success: false,
        message: "Cannot delete user with upcoming appointments. Cancel appointments first.",
        data: {
          upcomingAppointments: UserUpcomingAppointment.length,
          nextAppointment: UserUpcomingAppointment[0]?.slotDate
        }
      });
      return;
    }

       // Cancel all future appointment
    await AppointmentModel.updateMany(
      {
        docId: userId,
        slotDate: { $gte: new Date().toISOString().split('T')[0] },
        cancelled: false
      },
      {
        cancelled: true,
        cancelledBy: "admin",
        cancellationReason: "User account deleted by admin",
        cancelledAt: new Date()
      },
      { session }
    );

    await UserModel.findByIdAndDelete(userId).session(session)
    await session.commitTransaction()
     res.status(200).json({
      success: true,
      message: "Doctor deleted successfully",
      data: {
        userId,
        userName: user.name,
        userEmail: user.email,
        deletedAt: new Date(),
        cancelledAppointments: UserUpcomingAppointment.length
      }
    });
  } catch (error: any) {
  await session.abortTransaction();
    
    console.error("Delete doctor error:", error);

    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: "Invalid doctor ID format"
      });
      return;
    }

    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: "Validation error: " + error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete doctor",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });

  } finally {
    await session.endSession();
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
  deleteDoctorByAdmin,
  deleteUserByAdmin,
  getAllUser
  // seedInitialAdmin
}