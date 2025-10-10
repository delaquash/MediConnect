import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import UserModel from '../model/UserModel';
import DoctorModel from '../model/DoctorModel'
import { createOTp, createSecureToken, hashValue } from '../utils/token';
import EmailService from '../services/emailService';

const requestUserPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({
                success: false,
                message: "Email is required"
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

        // Find user - only verified users can reset password
        const user = await UserModel.findOne({ 
            email: trimmedEmail,
            isEmailVerified: true
        });

        // Standard response for security (don't reveal if email exists)
        const standardResponse = {
            success: true,
            message: "If an account exists with this email, a password reset link has been sent."
        };

        if (!user) {
            res.status(200).json(standardResponse);
            return;
        }

        // Generate secure token
        const { raw: resetToken, hash: resetTokenHash } = createSecureToken();
        const resetExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save token hash to user
        user.passwordResetToken = resetTokenHash;
        user.passwordResetExpires = resetExpiry;
        await user.save();

        // Send reset email with raw token
        const emailSent = await EmailService.sendPasswordResetLink(
            trimmedEmail, 
            resetToken, 
            'user'
        );

        if (!emailSent) {
            console.error('Failed to send password reset email to:', trimmedEmail);
            // Clear the token if email failed
            user.passwordResetToken = null;
            user.passwordResetExpires = null;
            await user.save();
        }

        res.status(200).json(standardResponse);

    } catch (error) {
        console.error("User password reset request error:", error);
        next(error);
    }
};

const resetUserPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            res.status(400).json({
                success: false,
                message: "Reset token and new password are required"
            });
            return;
        }

        // Validate password strength
        if (!validator.isStrongPassword(newPassword, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        })) {
            res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols"
            });
            return;
        }

        // Hash the incoming token to compare with stored hash
        const tokenHash = hashValue(token);

        // Find user with valid token that hasn't expired
        const user = await UserModel.findOne({
            passwordResetToken: tokenHash,
            passwordResetExpires: { $gt: new Date() }
        });

        if (!user) {
            res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
            return;
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        user.updatedAt = new Date();

        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successful! You can now login with your new password."
        });

    } catch (error) {
        console.error("User password reset error:", error);
        next(error);
    }
};

const requestDoctorPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({
                success: false,
                message: "Email is required"
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

        // Find doctor - only verified doctors can reset password
        const doctor = await DoctorModel.findOne({ 
            email: trimmedEmail,
            isEmailVerified: true 
        });

        const standardResponse = {
            success: true,
            message: "If an account exists with this email, a password reset link has been sent."
        };

        if (!doctor) {
            res.status(200).json(standardResponse);
            return;
        }

        // Generate secure token
        const { raw: resetToken, hash: resetTokenHash } = createSecureToken();
        const resetExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save token hash to doctor
        doctor.passwordResetToken = resetTokenHash;
        doctor.passwordResetExpires = resetExpiry;
        await doctor.save();

        // Send reset email with raw token
        const emailSent = await EmailService.sendPasswordResetLink(
            trimmedEmail, 
            resetToken, 
            'doctor'
        );

        if (!emailSent) {
            console.error('Failed to send doctor password reset email to:', trimmedEmail);
            // Clear token if email failed
            doctor.passwordResetToken = null;
            doctor.passwordResetExpires = null;
            await doctor.save();
        }

        res.status(200).json(standardResponse);

    } catch (error) {
        console.error("Doctor password reset request error:", error);
        next(error);
    }
};

// Reset Password for Doctor
const resetDoctorPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            res.status(400).json({
                success: false,
                message: "Reset token and new password are required"
            });
            return;
        }

        // Validate password strength
        if (!validator.isStrongPassword(newPassword, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        })) {
            res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols"
            });
            return;
        }

        // Hash the incoming token to compare with stored hash
        const tokenHash = hashValue(token);

        // Find doctor with valid token that hasn't expired
        const doctor = await DoctorModel.findOne({
            passwordResetToken: tokenHash,
            passwordResetExpires: { $gt: new Date() }
        });

        if (!doctor) {
            res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
            return;
        }

        // Update password (will be hashed by pre-save hook)
        doctor.password = newPassword;
        doctor.passwordResetToken = null;
        doctor.passwordResetExpires = null;
        doctor.updatedAt = new Date();

        await doctor.save();

        res.status(200).json({
            success: true,
            message: "Password reset successful! You can now login with your new password."
        });

    } catch (error) {
        console.error("Doctor password reset error:", error);
        next(error);
    }
};

// Resend OTP for Email Verification (for both users and doctors)
const resendVerificationOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, userType } = req.body; // userType: 'user' or 'doctor'

        if (!email || !userType) {
            res.status(400).json({
                success: false,
                message: "Email and user type are required"
            });
            return;
        }

        if (!['user', 'doctor'].includes(userType)) {
            res.status(400).json({
                success: false,
                message: "Invalid user type. Must be 'user' or 'doctor'"
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

        // Handle users and doctors separately to avoid TypeScript union issues
        let user: any;
        
        if (userType === 'doctor') {
            user = await DoctorModel.findOne({ 
                email: trimmedEmail,
                isEmailVerified: false 
            });
        } else {
            user = await UserModel.findOne({ 
                email: trimmedEmail,
                isEmailVerified: false 
            });
        }

        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found or already verified"
            });
            return;
        }

        // Generate new OTP
        const {  otp, hash: otpHash } = createOTp(6);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update user with new OTP hash
        user.emailVerificationToken = otpHash;
        user.passwordResetExpires = otpExpiry; // Reuse this field for OTP expiry
        await user.save();

        // Send new OTP email
        const emailSent = await EmailService.sendVerificationOTP(
            trimmedEmail, 
            otp, 
            userType as 'user' | 'doctor'
        );

        if (!emailSent) {
            res.status(500).json({
                success: false,
                message: "Failed to send verification email. Please try again."
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "New verification code sent to your email"
        });

    } catch (error) {
        console.error("Resend OTP error:", error);
        next(error);
    }
};

// Verify Password Reset Token (Optional - for frontend validation)
const verifyResetToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token, userType } = req.body;

        if (!token || !userType) {
            res.status(400).json({
                success: false,
                message: "Token and user type are required"
            });
            return;
        }

        if (!['user', 'doctor'].includes(userType)) {
            res.status(400).json({
                success: false,
                message: "Invalid user type"
            });
            return;
        }

        // Hash the token to compare
        const tokenHash = hashValue(token);
        
        // Handle users and doctors separately
        let user: any;
        
        if (userType === 'doctor') {
            user = await DoctorModel.findOne({
                passwordResetToken: tokenHash,
                passwordResetExpires: { $gt: new Date() }
            });
        } else {
            user = await UserModel.findOne({
                passwordResetToken: tokenHash,
                passwordResetExpires: { $gt: new Date() }
            });
        }

        if (!user) {
            res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Reset token is valid",
            email: user.email // Return email for frontend to show
        });

    } catch (error) {
        console.error("Token verification error:", error);
        next(error);
    }
};

export {
    requestUserPasswordReset,
    requestDoctorPasswordReset,
    resetUserPassword,
    resetDoctorPassword,
    resendVerificationOTP,
    verifyResetToken
};