import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { hashValue } from '../utils/token'; // Assuming you have a utility function to hash values
import EmailService from '../services/emailService'; // Adjust the import path as needed
import UserModel from "../model/userModel";

export const verifyUserOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
      return;
    }

    // Hash the provided OTP to compare with stored hash
    const otpHash = hashValue(otp);

    // Find user with matching email and OTP hash
    const user = await UserModel.findOne({
      email: email.trim().toLowerCase(),
      emailVerificationToken: otpHash,
      isEmailVerified: false
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid verification code or email already verified"
      });
      return;
    }

    // Check if user is already verified (extra safety check)
    if (user.isEmailVerified) {
      res.status(400).json({
        success: false,
        message: "Email is already verified"
      });
      return;
    }

    // Update user - mark as verified and clear verification data
    user.isEmailVerified = true;
    user.emailVerificationOTP = null;
    user.emailVerificationOTPExpires = null;
    await user.save();

    // Generate JWT token for the newly verified user
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Send welcome email with detailed error handling
    try {
      console.log('Calling EmailService.sendWelcomeEmail...');
      const userName = user.name || 'User';
      const emailResult = await EmailService.sendWelcomeEmail(user.email, userName ,'user');
      console.log('Welcome email result:', emailResult);
      
      if (emailResult) {
        console.log('Welcome email sent successfully to:', user.email);
      } else {
        console.log('Welcome email failed to send (returned false)');
      }
    } catch (emailError: any) {
      console.error('Welcome email error details:');
      console.error('Error message:', emailError.message);
      console.error('Error stack:', emailError.stack);
      console.error('Error code:', emailError.code);
      // Don't fail the verification if welcome email fails
    }

    console.log('User email verified successfully:', user.email);

    res.status(200).json({
      success: true,
      message: "Email verified successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: true
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    next(error);
  }
};