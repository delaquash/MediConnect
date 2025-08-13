// services/emailService.ts
import sgMail from '@sendgrid/mail';
import { createOTp, createSecureToken } from "../utils/token"

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private static async sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
    try {
      await sgMail.send({
        to,
        from: process.env.SENDGRID_FROM_EMAIL!, // Your verified sender
        subject,
        html
      });
      return true;
    } catch (error) {
      console.error('SendGrid Error:', error);
      return false;
    }
  }

  // Send OTP for email verification (Registration)
  static async sendVerificationOTP(email: string, otp: string, userType: 'user' | 'doctor'): Promise<boolean> {
    const subject = `Verify Your Email - ${userType === 'doctor' ? 'Doctor' : 'User'} Account`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-box { background: #fff; border: 2px dashed #007bff; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px; }
            .warning { color: #e74c3c; font-size: 14px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Verification Required</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>Thank you for registering your ${userType} account. To complete your registration, please verify your email address using the OTP below:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <p>Enter this 6-digit code to verify your email</p>
              </div>
              
              <p><strong>This verification code will expire in 10 minutes.</strong></p>
              
              <div class="warning">
                <p><strong>Security Note:</strong> If you didn't request this verification, please ignore this email.</p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2025 Your App Name. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail({ to: email, subject, html });
  }

  // Send password reset link
  static async sendPasswordResetLink(email: string, resetToken: string, userType: 'user' | 'doctor'): Promise<boolean> {
    const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&type=${userType}`;
    const subject = `Password Reset Request - ${userType === 'doctor' ? 'Doctor' : 'User'} Account`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #e74c3c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .reset-button { display: inline-block; background: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .reset-button:hover { background: #c0392b; }
            .warning { color: #e74c3c; font-size: 14px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>We received a request to reset your ${userType} account password. Click the button below to create a new password:</p>
              
              <div style="text-align: center;">
                <a href="${resetURL}" class="reset-button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 4px; font-family: monospace;">
                ${resetURL}
              </p>
              
              <p><strong>This reset link will expire in 10 minutes.</strong></p>
              
              <div class="warning">
                <p><strong>Security Note:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2025 Your App Name. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail({ to: email, subject, html });
  }

  // Send welcome email after successful verification
  static async sendWelcomeEmail(email: string, name: string, userType: 'user' | 'doctor'): Promise<boolean> {
    const subject = `Welcome to Our Platform - ${userType === 'doctor' ? 'Doctor' : 'User'} Account Verified!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome!</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .cta-button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Our Platform!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Congratulations! Your ${userType} account has been successfully verified and is now active.</p>
              
              <p>You can now:</p>
              <ul>
                <li>Complete your profile</li>
                <li>Access all platform features</li>
                ${userType === 'doctor' ? '<li>Start managing your practice</li>' : '<li>Book appointments with doctors</li>'}
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="cta-button">Go to Dashboard</a>
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2025 Your App Name. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail({ to: email, subject, html });
  }
}

export default EmailService;