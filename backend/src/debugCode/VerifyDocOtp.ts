import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { hashValue } from '../utils/token'; // Assuming you have a utility function to hash values
import EmailService from '../services/emailService'; // Adjust the import path as needed
import DoctorModel from '../model/doctorModel';

export const verifyDocOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    // Find doc with matching email and OTP hash
    const doc = await DoctorModel.findOne({
      email: email.trim().toLowerCase(),
      emailVerificationToken: otpHash,
      isEmailVerified: false
    });

    if (!doc) {
      res.status(400).json({
        success: false,
        message: "Invalid verification code or email already verified"
      });
      return;
    }

    // Check if doc is already verified (extra safety check)
    if (doc.isEmailVerified) {
      res.status(400).json({
        success: false,
        message: "Email is already verified"
      });
      return;
    }

    // Update doc - mark as verified and clear verification data
    doc.isEmailVerified = true;
    doc.emailVerificationOTP = null;
    doc.emailVerificationOTPExpires = null;
    await doc.save();

    // Generate JWT token for the newly verified doc
    const token = jwt.sign(
      { id: doc._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Debug welcome email sending
    console.log('🔄 Attempting to send welcome email...');
    console.log('Email service ready?', EmailService.isReady());
    console.log('doc data for email:', {
      email: doc.email,
      name: doc.name,
      docType: 'doc'
    });

    // Send welcome email with detailed error handling
    try {
      console.log('📧 Calling EmailService.sendWelcomeEmail...');
      const docName = doc.name || 'doc';
      const emailResult = await EmailService.sendWelcomeEmail(doc.email, docName ,'doctor');
      console.log('📧 Welcome email result:', emailResult);
      
      if (emailResult) {
        console.log('✅ Welcome email sent successfully to:', doc.email);
      } else {
        console.log('❌ Welcome email failed to send (returned false)');
      }
    } catch (emailError: any) {
      console.error('⚠️ Welcome email error details:');
      console.error('Error message:', emailError.message);
      console.error('Error stack:', emailError.stack);
      console.error('Error code:', emailError.code);
      // Don't fail the verification if welcome email fails
    }

    console.log('✅ doc email verified successfully:', doc.email);

    res.status(200).json({
      success: true,
      message: "Email verified successfully!",
      token,
      doc: {
        id: doc._id,
        name: doc.name,
        email: doc.email,
        isEmailVerified: true
      }
    });

  } catch (error) {
    console.error('❌ OTP verification error:', error);
    next(error);
  }
};