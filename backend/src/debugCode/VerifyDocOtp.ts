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
    
    const otpHash = hashValue(otp);

    const doctor = await DoctorModel.findOne({
      email: trimmedEmail,
      emailVerificationToken: otpHash,
      isEmailVerified: false
    });

    if (!doctor) {
      res.status(400).json({
        success: false,
        message: "Invalid verification code or email already verified"
      });
      return;
    }

    // Check if OTP has expired
    if (doctor.emailVerificationOTPExpires && doctor.emailVerificationOTPExpires < new Date()) {
      res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new one."
      });
      return;
    }

    // Update doctor - mark as verified and clear verification data
    doctor.isEmailVerified = true;
    doctor.emailVerificationOTP = undefined;
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
      console.log('ending welcome email...');
      const doctorName = doctor.name || 'Doctor';
      const emailResult = await EmailService.sendWelcomeEmail(
        doctor.email, 
        doctorName, 
        'doctor'
      );
      
      if (emailResult) {
        console.log('Welcome email sent successfully to:', doctor.email);
      } else {
        console.log('Welcome email failed to send');
      }
    } catch (emailError: any) {
      console.error('Welcome email error:', emailError);
    }

    console.log('Doctor email verified successfully:', doctor.email);

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
