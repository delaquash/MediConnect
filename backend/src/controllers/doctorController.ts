import { NextFunction, Request, Response } from 'express';
import DoctorModel from '../model/doctorModel';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import AppointmentModel from '../model/appointmentModel';
import { AuthenticatedDoctorRequest } from '../middlewares/docAuth';
import { validateProfileData } from '../helper/validateProfileData';
import cloudinary  from "../config/cloudinary";


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
        if (!req.body) {
            res.status(400).json({
                success: false,
                message: "Request body is required"
            });
            return;
        }

        const { email, password } = req.body

        if (!email || !password) {
            res.status(400).json({ 
                success: false, 
                message: "Email and password are required" 
            });
            return;
        }

        // Find doctor by email
        const doctor = await DoctorModel.findOne({ email }).select("+password");

        if (!doctor) {
            res.status(401).json({ 
                success: false, 
                message: "Invalid credentials" 
            });
            return;
        }

        // ✅ Use the comparePassword method from your model
        const isPasswordValid = await doctor.comparePassword(password);
        
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
            return;
        }

        // Generate token
        const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET!, {
            expiresIn: "30d" 
        });

        // Don't send password in response
        const doctorResponse = doctor.toObject();
        // delete doctorResponse?.password;

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            doctor: doctorResponse
        });

    } catch (error) {
        next(error);
    }
}


const getDoctorAppointments = async (req: AuthenticatedDoctorRequest, res: Response, next: NextFunction): Promise<void> => {
  try {

    const doctorId = req.docId; 
    
    // Validate doctor ID format
    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      res.status(400).json({
        success: false,
        message: "Invalid doctor ID format"
      });
      return;
    }
    
    // Get query parameters for filtering (optional)
    const { status, date, page = 1, limit = 10 } = req.query;
    
    // Build query filter
    const filter: any = { 
      docId: doctorId,
      cancelled: false, 
      slotDate: { 
        $gte: new Date().toISOString().split('T')[0] // Future and today's appointments
      }
    };
    
    // Add additional filters if provided
    if (status === 'completed') {
      filter.isCompleted = true;
    } else if (status === 'pending') {
      filter.isCompleted = false;
    }
    
    if (date) {
      filter.slotDate = date; // Specific date filter
    }
    
    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    
    const appointments = await AppointmentModel.find(filter)
      .populate('userId', 'name phone email') // Populate user details
      .sort({ slotDate: 1, slotTime: 1 }) // Sort by date and time
      .skip(skip)
      .limit(limitNum);
    
    // Get total count for pagination
    const totalAppointments = await AppointmentModel.countDocuments(filter);
    
    // Format appointments for better response structure
    const formattedAppointments = appointments.map(apt => ({
      appointmentId: apt._id,
      patient: {
        name: apt.userData.name,
        phone: apt.userData.phone,
        address: apt.userData.address
      },
      appointment: {
        date: apt.slotDate,
        time: apt.slotTime,
        amount: apt.amount,
        status: apt.isCompleted ? 'completed' : 'pending',
        paymentStatus: apt.payment ? 'paid' : 'pending',
        createdAt: apt.date
      }
    }));
    
    res.status(200).json({
      success: true,
      message: "Appointments retrieved successfully",
      data: {
        appointments: formattedAppointments,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalAppointments / limitNum),
          totalAppointments,
          hasNext: pageNum < Math.ceil(totalAppointments / limitNum),
          hasPrev: pageNum > 1
        }
      }
    });
    
  } catch (error:any) {
    console.error("Get doctor appointments error:", error);
    
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: "Invalid ID format"
      });
      return;
    }
    
    next(error);
  }
};

const doctorCancelAppointment = async (req: any, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const doctorId = req.docId; // Authenticated doctor ID
      const { appointmentId, reason } = req.body;
      
      // Find appointment belonging to this doctor
      const appointment = await AppointmentModel.findOne({
        _id: appointmentId,
        docId: doctorId,           
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
          cancelledBy: 'doctor',    
          cancellationReason: reason
        },
        { session }
      );
      
      // Free up the time slot
      const doctor = await DoctorModel.findById(doctorId).session(session);
      const updatedSlots = { ...doctor?.slots_booked };
      const dateSlots = updatedSlots[appointment.slotDate] || [];
      updatedSlots[appointment.slotDate] = dateSlots.filter((slot: string) => slot !== appointment.slotTime);
      
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

const appointmentComplete = async(req: any, res: Response, next: NextFunction): Promise<void>=>{
    try {
        const  authenticatedDoctorId  = req.docId;
        const { appointmentId } = req.body;

        // validate appointment ID format
        if(!mongoose.Types.ObjectId.isValid(appointmentId)){
            res.status(400).json({
                success: false,
                message: "Invalid appointment ID"
            })
            return;
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
       res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
      return;
    }
      // Check if already completed or cancelled
    if (appointmentData.isCompleted) {
       res.status(400).json({
        success: false,
        message: "Appointment already completed"
      });
        return;
    }
    
    if (appointmentData.cancelled) {
       res.status(400).json({
        success: false,
        message: "Cannot complete cancelled appointment"
      });
      return;
    }
    
    const appointmentDetails = await AppointmentModel.findByIdAndUpdate(appointmentId, {
      isCompleted: true,
    });
    
    res.status(200).json({
      success: true,
      message: "Appointment completed successfully",
      data: {
        appointmentDetails
      }
    });
    } catch (error) {
        next(error)
    }
}
const doctorsDashboard = async (req: any | AuthenticatedDoctorRequest, res: Response, next: NextFunction): Promise<void> => {
     try {
    const authenticatedDoctorId = req.docId;
    
    if (!mongoose.Types.ObjectId.isValid(authenticatedDoctorId)) {
      res.status(400).json({
        success: false,
        message: "Invalid doctor ID format"
      });
      return;
    }
    
    const doctor = await DoctorModel.findById(authenticatedDoctorId);
    if (!doctor) {
      res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
      return;
    }
    
    const appointments = await AppointmentModel.find({ 
      docId: authenticatedDoctorId
    }).populate('userId', 'name email phone');
    
    // Calculate total earnings from completed/paid appointments
    let earnings = 0;
    appointments.forEach((appointment) => {
      // Count earnings only if appointment is completed OR payment is made
      if (appointment.isCompleted || appointment.payment) {
        earnings += appointment?.amount || 5000;
      }
    });
    
    // Get unique patient count using Set for better performance
    const uniquePatients = new Set<string>();
    appointments.forEach((appointment) => {
      uniquePatients.add(appointment.userId.toString());
    });
    
    // Filter appointments for better dashboard metrics
    const activeAppointments = appointments.filter(apt => !apt.cancelled);
    const completedAppointments = appointments.filter(apt => apt.isCompleted);
    const pendingAppointments = appointments.filter(apt => !apt.isCompleted && !apt.cancelled);
    const todaysAppointments = appointments.filter(apt => {
      const today = new Date().toISOString().split('T')[0];
      return apt.slotDate === today && !apt.cancelled;
    });
    
    // Get latest 5 appointments (most recent first)
    const latestAppointments = activeAppointments
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(apt => ({
        appointmentId: apt._id,
        patientName: apt.userData.name,
        patientPhone: apt.userData.phone,
        slotDate: apt.slotDate,
        slotTime: apt.slotTime,
        status: apt.isCompleted ? 'completed' : apt.cancelled ? 'cancelled' : 'pending',
        amount: apt.amount,
        paymentStatus: apt.payment ? 'paid' : 'pending'
      }));
    

    const dashData = {
      earnings,
      totalAppointments: appointments.length,
      activeAppointments: activeAppointments.length,
      completedAppointments: completedAppointments.length,
      pendingAppointments: pendingAppointments.length,
      todaysAppointments: todaysAppointments.length,
      totalPatients: uniquePatients.size,
      latestAppointments,
      doctorInfo: {
        name: doctor.name,
        speciality: doctor.specialty,
        available: doctor.available,
        email: doctor.email
      }
    };
    
    res.status(200).json({ 
      success: true, 
      dashData 
    });
    
  } catch (error:any) {
    console.error("Doctor dashboard error:", error);
    
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: "Invalid data format"
      });
      return;
    }
    
    next(error);
  }
};

const getDoctorProfile = async (req: AuthenticatedDoctorRequest, res: Response, next: NextFunction): Promise<void> => {
  try {

    const doctorId = req.docId; 
    // Validate doctor ID format
    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      res.status(400).json({
        success: false,
        message: "Invalid doctor ID format"
      });
      return;
    }
    
    // Find doctor profile excluding sensitive fields
    const doctorProfile = await DoctorModel.findById(doctorId).select("-password -__v");
    
    if (!doctorProfile) {
      res.status(404).json({
        success: false,
        message: "Doctor profile not found"
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: "Doctor profile retrieved successfully",
      data: {
        profile: {
          id: doctorProfile._id,
          name: doctorProfile.name,
          email: doctorProfile.email,
          speciality: doctorProfile.specialty,
          degree: doctorProfile.degree,
          experience: doctorProfile.experience,
          about: doctorProfile.about,
          fees: doctorProfile.fees,
          image: doctorProfile.image,
          address: doctorProfile.address,
          available: doctorProfile.available,
          totalSlots: Object.keys(doctorProfile.slots_booked || {}).length
        }
      }
    });
    
  } catch (error: any) {
    console.error("Get doctor profile error:", error);
    
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: "Invalid doctor ID format"
      });
      return;
    }
    
    next(error);
  }
};

const updateDoctorProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const docId = req.docId
    const imageFile = req.file;
    let {name, phone, specialty, degree, experience, about, fees, address} = req.body;

    console.log('=== DEBUG INFO ===');
    console.log('imageFile:', imageFile ? 'Present' : 'Not present');
    console.log('req.body keys:', Object.keys(req.body));
    console.log('==================');

    if(!docId){
      res.status(401).json({
        success: false,
        message: "Doctor does not exist"
      });
      return;
    }

    // Parse JSON strings from form-data
    if (address && typeof address === 'string') {
      try {
        address = JSON.parse(address);
      } catch (e) {
        res.status(400).json({
          success: false,
          message: "Invalid address format"
        });
        return;
      }
    }

    // Convert fees to number if it's a string
    if (fees !== undefined && typeof fees === 'string') {
      fees = parseFloat(fees);
      if (isNaN(fees)) {
        res.status(400).json({
          success: false,
          message: "Invalid fees format"
        });
        return;
      }
    }

    // Only validate if we have fields to validate
    const hasFieldsToValidate = name || phone || specialty || degree || experience || about || fees || address;
    
    if (hasFieldsToValidate) {
      const errors = validateProfileData({ name, phone, image: undefined, specialty, degree, experience, about, fees, address}, false)
      if (errors && errors.length > 0) {
        console.log('Validation errors:', errors);
        res.status(400).json({
          success: false,
          message: "Profile validation failed",
          errors
        });
        return;
      }
    }

    const doc = await DoctorModel.findById(docId);
    if(!doc){
      res.status(404).json({
        success: false,
        message: "Doctor not found"
      })
      return
    }

    const trimmedAddress = address ? Object.fromEntries(
      Object.entries(address).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value
      ])
    ) : undefined;

    const updateDocData: any = {}

    if(name !== undefined) updateDocData.name = name.trim();
    if(phone !== undefined) updateDocData.phone = phone.trim();
    if(specialty !== undefined) updateDocData.specialty = specialty.trim();
    if(degree !== undefined) updateDocData.degree = degree.trim();
    if(experience !== undefined) updateDocData.experience = typeof experience === 'string' ? experience.trim() : experience;
    if(about !== undefined) updateDocData.about = about.trim();
    if(fees !== undefined) updateDocData.fees = fees;
    if(address !== undefined) updateDocData.address = trimmedAddress;

    // cloudinary to handle image upload
    if (imageFile) {
      console.log('Starting Cloudinary upload...');
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
        
        console.log('Cloudinary upload successful!');
        updateDocData.image = result.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        res.status(500).json({
          success: false,
          message: "Failed to upload image",
          error: uploadError instanceof Error ? uploadError.message : 'Unknown error'
        });
        return;
      }
    }

    const updatedDocTemp = { ...doc.toObject(), ...updateDocData}

    // check if all required fields are now present
    const isProfileComplete = ["image", "specialty", "degree", "experience", "about", "fees", "address"].every(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], updatedDocTemp);
      return value !== null && value !== undefined && value !== '';
    })

    // if profile wasn't complete before, but it is now complete, mark it 
    if(isProfileComplete && !doc.profileComplete) {
      updateDocData.profileComplete = true
      updateDocData.profileCompletedAt = new Date()
    }

    const updatedDocProfile = await DoctorModel.findByIdAndUpdate(
      docId,
      updateDocData,
      {
        new: true,
        runValidators: true
      }
    ).select("-password")
    
    res.status(200).json({
      success: true,
      message: "Doctor's Profile updated successfully",
      user: updatedDocProfile
    });
  } catch (error) {
    console.error('Controller error:', error);
    next(error);
  }
}

const completeDoctorProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
   const docId = req.docId
    const imageFile = req?.file;
    const {name, phone, image, specialty, degree, experience, about, fees, address} = req.body;

    if(!docId){
      res.status(401).json({
        success: false,
        message: "Doctor does not exist"
      });
      return;
    }

    const errors = validateProfileData({ name, phone, image, specialty, degree, experience, about, fees, address}, false)
    if (errors && errors.length > 0) {
      res.status(400).json({
        success: false,
        message: "Profile validation failed",
        errors
      });
      return;
    }

    const doc = await DoctorModel.findById(docId);
    if(!doc){
      res.status(404).json({
        success: false,
        message: "Doctor not found"
      })
      return
    }

    if(doc?.profileComplete){
        res.status(400).json({
        success: false,
        message: "Profile is already complete. Kindly update profile"
      })
      return
    }

    const trimmedAddress = Object.fromEntries(
      Object.entries(address || {}).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value
      ])
    );
    // prepare update data 
    const docProfileDataUpDate: any= {
      phone: phone.trim(),
      specialty: specialty.trim(),
      degree: degree.trim(),
      experience: experience.trim(),
      about:about.trim(),
      address: address.trimmedAddress,
      
      profileComplete: true,
      profileCompletedAt: new Date()
    }

      if (imageFile) {
        try {
          
          const fileStr = `data:${imageFile.mimetype};base64,${imageFile?.buffer?.toString('base64')}`;
        
          const result = await cloudinary.uploader.upload(fileStr, {
            folder: 'doctors-profiles',
            resource_type: 'auto',
            transformation: [
              { width: 500, height: 500, crop: 'fill', gravity: 'face' },
              { quality: 'auto:good' }
            ]
          });
          
          docProfileDataUpDate.image = result.secure_url;
        } catch (uploadError) {
          console.error("Image upload error:", uploadError);
          res.status(500).json({
            success: false,
            message: "Failed to upload image"
          });
          return;
        }
      }

      const completeDocProfile = await DoctorModel.findByIdAndUpdate(
        docId,
        docProfileDataUpDate, 
        {
          new: true, 
          runValidators: true
        }
      ).select("-password")

       res.status(200).json({
          success: true,
          message: "Profile completed successfully. Please proceed to accepting appointment",
          doctor: completeDocProfile
        })
  } catch (error) {
    next(error);
    console.error("Unable to complete profile", error);
  }
}

export {
    doctorList,
    loginDoctor,
    getDoctorAppointments,
    doctorCancelAppointment,
    appointmentComplete,
    doctorsDashboard,
    getDoctorProfile,
    updateDoctorProfile,
    completeDoctorProfile
}