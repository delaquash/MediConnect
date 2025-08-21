import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { hashValue } from '../utils/token'; 
import EmailService from '../services/emailService'; 
import DoctorModel from '../model/doctorModel';

export const verifyDoctorOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const doctor = await DoctorModel.findOne({ email: trimmedEmail });

    if (!doctor) {
      res.status(404).json({
        success: false,
        message: "No account found with this email"
      });
      return;
    }

    if (doctor.isEmailVerified) {
      res.status(400).json({
        success: false,
        message: "Email is already verified"
      });
      return;
    }

    if (!doctor.emailVerificationToken) {
      res.status(400).json({
        success: false,
        message: "No verification code found. Please request a new one."
      });
      return;
    }

    const otpHash = hashValue(otp);
    if (doctor.emailVerificationToken !== otpHash) {
      res.status(400).json({
        success: false,
        message: "Invalid verification code"
      });
      return;
    }

    if (doctor.emailVerificationOTPExpires && doctor.emailVerificationOTPExpires < new Date()) {
      res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new one."
      });
      return;
    }

    // Update doctor - mark as verified and clear verification data
    doctor.isEmailVerified = true;
    doctor.emailVerificationToken = undefined;
    doctor.emailVerificationOTPExpires = undefined;
    await doctor.save();

    const token = jwt.sign(
      { 
        id: doctor._id,
        email: doctor.email,
        type: 'doctor'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    try {
      const doctorName = doctor.name || 'Doctor';
      await EmailService.sendWelcomeEmail(doctor.email, doctorName, 'doctor');
    } catch (emailError) {
      console.error('Welcome email error:', emailError);
    }

    res.status(200).json({
      success: true,
      message: "Email verified successfully! Please complete your profile to start accepting patients.",
      token,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        isEmailVerified: true,
        profileComplete: doctor.profileComplete || false
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    next(error);
  }
};