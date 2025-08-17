import { NextFunction, Request, Response } from 'express';
import UserModel, { IUser } from '../model/userModel';
import mongoose from 'mongoose';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import DoctorModel from '../model/doctorModel';
import AppointmentModel from '../model/appointmentModel';
import { generateTimeSlots, isValidTimeSlot } from '../utils/timeSlot';
import { isValidAppointmentDate } from '../utils/appointmentDate';
import { AuthenticatedRequest } from '../types/global';
import { validateProfileData } from '../helper/validateProfileData';
import { IProfileUpdateData } from '../types/type';
import { createOTp, hashValue } from '../utils/token';
import EmailService from '../services/emailService';

const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Please fill all fields"
      });
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (trimmedName.length < 2 || trimmedName.length > 50) {
      res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters long and less than 50 characters"
      });
      return;
    }

    if (!validator.isEmail(trimmedEmail)) {
      res.status(400).json({
        success: false, // ✅ Added missing success field
        message: "Invalid email format"
      });
      return;
    }

    if (!validator.isStrongPassword(trimmedPassword, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })) {
      res.status(400).json({
        success: false, // ✅ Added missing success field
        message: "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and symbols",
      });
      return;
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: trimmedEmail });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "User already exists with this email"
      });
      return;
    }

    // Generate OTP and time for token to expire
    const { otp, hash: otpHash } = createOTp(6); // ✅ Fixed function name and destructuring
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = new UserModel({
      name: trimmedName,
      email: trimmedEmail,
      password: trimmedPassword,
      image: null,
      address: {
        line1: "",
        line2: ""
      },
      gender: null,
      dob: null,
      phone: null,
      profileComplete: false,
      isEmailVerified: false,
      emailVerificationToken: otpHash,
      passwordResetExpires: otpExpiry,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const newRegisteredUser = await user.save();

    // Send Email OTP
    const sendEmailVerification = await EmailService.sendVerificationOTP(
      trimmedEmail,
      otp,
      "user"
    );

    if (!sendEmailVerification) {
      // Clean up - delete user if email fails
      await UserModel.findByIdAndDelete(newRegisteredUser._id);
      res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again."
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email for verification code.",
      userId: newRegisteredUser._id,
      email: trimmedEmail,
      name: trimmedName
    });

  } catch (error) {
    console.error("Registration error:", error); // ✅ Add logging
    next(error);
  }
}

const verifyUserOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp } = req.body;

    const otpHash = hashValue(otp);

    const user = await UserModel.findOne({
      email: email.trim().toLowerCase(),
      emailVerificationToken: otpHash,
      passwordResetExpires: { $gt: new Date() },
      isEmailVerified: false
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired verification code"
      });
      return;
    }

    user.isEmailVerified = true;
    user.emailVerificationOTP = null;
    user.passwordResetExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully!"
    });

  } catch (error) {
    next(error);
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required" });
      return;
    }

    const user = await UserModel.findOne({ email })

    if (!user) {
      res.json({ success: false, message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "30d"
    })

    res.status(200).json({
      success: true,
      message: "User login successfully",
      token
      ,
    })
  } catch (error) {
    next(error)
  }
}

const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
      return;
    }

    const userProfile = await UserModel.findById(userId).select("-password");

    if (!userProfile) {
      res.status(404).json({
        success: false,
        message: "User not found"
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User profile successfully retrieved",
      userProfile
    });

  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {

    const userId = req.userId;

    const { name, phone, address, dob, gender, password } = req.body;

    const imageFile = req.file;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
      return;
    }

    const errors = validateProfileData({ name, phone, address, dob, gender, password }, false);
    if (errors && errors.length > 0) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
      return;
    }

    // Find existing user to verify they exist
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found"
      });
      return;
    }
    // Prepare update data object
    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (address !== undefined) {
      updateData.address = {
        line1: address.line1?.trim() || "",
        line2: address.line2?.trim() || ""
      };
    }
    if (dob !== undefined) updateData.dob = new Date(dob);
    if (gender !== undefined) updateData.gender = gender;
    if (password !== undefined) updateData.password = password;

    // Handle image upload with same logic as profile completion
    if (imageFile) {
      try {

        const fileStr = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;

        const result = await cloudinary.uploader.upload(fileStr, {
          folder: 'user-profiles',
          resource_type: 'auto',
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good' }
          ]
        });

        updateData.image = result.secure_url;
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        res.status(500).json({
          success: false,
          message: "Failed to upload image"
        });
        return;
      }
    }

    // Smart profile completion detection - check if profile should now be marked complete
    const updatedUserTemp = { ...user.toObject(), ...updateData }; // Merge existing + new data

    // Check if all required fields are now present
    const isProfileComplete = ['phone', 'address.line1', 'gender', 'dob'].every(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], updatedUserTemp);
      return value !== null && value !== undefined && value !== '';
    });

    // If profile wasn't complete before but is complete now, mark it
    if (isProfileComplete && !user.profileComplete) {
      updateData.profileComplete = true;
      updateData.profileCompletedAt = new Date();
    }

    // Update user document with only the changed fields
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select("-password");

    // Send success response
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Update profile error:", error);
    next(error);
  }
};


const bookAppointment = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  // Start MongoDB session for transaction support (ensures data consistency)
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Extract data from incoming HTTP request
      const authenticatedUserId = req.userId;
      const { docId, userId, slotDate, slotTime } = req.body;

      //   // Verify that authenticated user is booking for themselves (prevent unauthorized bookings)
      if (authenticatedUserId !== userId) {
        res.status(403).json({
          success: false,
          message: "You can only book appointments for yourself"
        })
      }

      if (!userId || !docId || !slotDate || !slotTime) {
        res.status(400).json({
          success: false,
          message: "All fields are required"
        })
      }

      // Validate that user ID and doctor ID are valid MongoDB ObjectIds
      if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(docId)) {
        res.status(400).json({
          success: false,
          message: "Invalid user or doctor ID"
        });
        return;
      }


      if (!isValidAppointmentDate(slotDate)) {
        res.status(400).json({
          success: false,
          message: "Invalid appointment date. Must be today or within 3 months."
        });
        return;
      }


      if (!isValidTimeSlot(slotTime)) {
        res.status(400).json({
          success: false,
          message: "Invalid time slot. Please select a valid time between 9:00 AM and 5:00 PM"
        });
        return;
      }

      const user = await UserModel.findById(userId).session(session)

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found"
        });
        return;
      }

      const doctor = await DoctorModel.findById(docId).session(session)

      if (!doctor) {
        res.status(404).json({
          success: false,
          message: "Doctor not found"
        });
        return;
      }
      if (!doctor.available) {
        res.status(400).json({
          success: false,
          message: "Doctor is currently unavailable for appointments"
        });
        return;
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

      const existingAppointment = await AppointmentModel.findOne({
        userId,
        docId,
        slotDate,
        slotTime,
        cancelled: false
      }).session(session);


      if (existingAppointment) {
        res.status(409).json({
          success: false,
          message: "You already have an appointment with this doctor at this time"
        });
        return;
      }
      // Prepare appointment data object with all required information

      const appointmentData = {
        userId,
        docId,
        slotDate,
        slotTime,
        userData: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address
        },
        docData: {
          name: doctor.name,
          specialty: doctor.specialty,
          degree: doctor.degree,
          fees: doctor.fees
        },
        amount: doctor.fees,
        date: Date.now(),
        cancelled: false,
        payment: false,
        isCompleted: false
      }



      const newAppointment = new AppointmentModel(appointmentData);

      await newAppointment.save({ session });

      // Create copy of doctor's existing booked slots to avoid mutation
      const updatedBookedSlots = { ...doctorSlotsBooked };
      // If no slots exist for this date, initialize empty array
      if (!updatedBookedSlots[slotDate]) {
        updatedBookedSlots[slotDate] = [];
      }
      // Add the newly booked time slot to the date's array
      updatedBookedSlots[slotDate].push(slotTime);


      await DoctorModel.findByIdAndUpdate(
        docId,
        { slots_booked: updatedBookedSlots },
        { session }
      );
      // Send successful response with appoi
      res.status(201).json({
        success: true,
        message: "Appointment booked successfully",
        appointment: {
          appointmentId: newAppointment._id,
          doctorName: doctor.name,
          speciality: doctor.specialty,
          slotDate,
          slotTime,
          fees: doctor.fees,
          status: "confirmed"
        }
      });
    })
  } catch (error: any) {

    console.error("Book appointment error:", error);


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

    next(error);
  } finally {
    await session.endSession();
  }
}


const listAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
      return;
    }
    const userAppointment = await AppointmentModel.find({ userId });
    res.status(200).json({
      success: true,
      message: "Appointment details successfully retrieved",
      userAppointment
    })
  } catch (error) {
    next(error)
  }
}



const cancelAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Start MongoDB session for transaction support
  const session = await mongoose.startSession();

  try {
    // Execute cancellation within transaction
    await session.withTransaction(async () => {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated"
        });
        return;
      }

      const { appointmentId } = req.body;

      const appointment = await AppointmentModel.findOne({
        _id: appointmentId,
        userId,
        cancelled: false
      }).session(session);

      if (!appointment) {
        res.status(404).json({
          success: false,
          message: "Appointment not found or already cancelled"
        });
        return;
      }
      await AppointmentModel.findByIdAndUpdate(
        appointmentId,
        { cancelled: true },
        { session }
      );

    
      const doctor = await DoctorModel.findById(appointment.docId).session(session);
      if (doctor) {                         
        const updatedSlots = { ...doctor.slots_booked };
        // Get current booked slots for appointment date
        const dateSlots = updatedSlots[appointment.slotDate] || [];
        // Remove cancelled appointment time from booked slots
        updatedSlots[appointment.slotDate] = dateSlots.filter((slot: string) => slot !== appointment.slotTime);
        await DoctorModel.findByIdAndUpdate(
          appointment.docId,                
          { slots_booked: updatedSlots },    
          { session }                       
        );
      }
      res.status(200).json({              
        success: true,
        message: "Appointment cancelled successfully"
      });
    });
  } catch (error) {
    next(error);
  } finally {
    // Always end the MongoDB session
    await session.endSession();
  }
};


// / Get available slots for a doctor on a specific date
const getAvailableSlots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { docId, date } = req.params;

    if (!mongoose.Types.ObjectId.isValid(docId)) {
      res.status(400).json({
        success: false,
        message: "Invalid doctor ID"
      });
      return;
    }

    // Find doctor in database
    const doctor = await DoctorModel.findById(docId);
    if (!doctor) {
      res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
      return;
    }
    // Generate all possible time slots for the day
    const allSlots = generateTimeSlots();
    // Get booked slots for the requested date (empty array if none)
    const bookedSlots = doctor.slots_booked[date] || [];
    // Filter out booked slots to get available slots
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    // Return availability information
    res.status(200).json({
      success: true,
      availableSlots,
      totalSlots: allSlots.length,
      bookedSlots: bookedSlots.length
    });

  } catch (error) {
    console.error("Get available slots error:", error);
    next(error);
  }
};


const completeProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId
    const { name, phone, address, dob, gender, password } = req.body
    const imageFile = req.file

    // Check if user is authenticated
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated"
      })
      return
    }

    // Validate profile data
    const errors = validateProfileData({ name, phone, address, dob, gender, password }, true);
    if (errors && errors.length > 0) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      })
      return
    }

    // Look for the user
    const user = await UserModel.findById(userId)

    if (!user) {
      res.status(404).json({
        sucess: false,
        message: "User does not exist."
      })
    }

    if (user?.profileComplete) {
      res.status(400).json({
        success: false,
        message: "Profile is already complete. Kindly update profile"
      })
      return
    }

    // Prepare update data
    const profileDataUpdate: IProfileUpdateData = {
      name: name.trim(),
      phone: phone.trim(),
      address: {
        line1: address.line1.trime() || "",
        line2: address.line2.trime() || ""
      },
      dob: new Date(dob),
      profileComplete: true,
      profileCompletedAt: new Date()
    }

    if (gender) profileDataUpdate.gender = gender;
    if (password) profileDataUpdate.password = password;

    // Handle Image Upload to cloudinary
    if (imageFile) {
      try {
        const storedImage = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;


        const result = await cloudinary.uploader.upload(storedImage, {
          folder: "user-profile",
          resource_type: "auto",
          transformation: [
            { width: 500, height: 500, crop: "fill", gravity: "face" },
            { quality: "auto-good" }
          ]
        })

        profileDataUpdate.image = result.secure_url
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        res.status(500).json({
          success: false,
          message: "Failed to upload image"
        });
        return;
      }
    }

    const completedProfile = await UserModel.findByIdAndUpdate(
      userId,
      profileDataUpdate,
      {
        new: true,
        runValidators: true
      }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile completed successfully. Please proceed to booking of appointment",
      user: completedProfile
    })
  } catch (error) {
    console.error("Complete profile error:", error);
    next(error);
  }
}

const getProfileStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => { }

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  completeProfile,
  getProfileStatus,
  verifyUserOTP
}