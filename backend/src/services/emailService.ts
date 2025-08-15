// services/emailService.ts
import nodemailer from 'nodemailer';
import { createOTp, createSecureToken } from "../utils/token"

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private static transporter: nodemailer.Transporter;

  // Initialize the transporter (call this once when your app starts)
  static async initialize() {
    try {
      // Create transporter with your email provider settings
      this.transporter = nodemailer.createTransport({
        // Option 1: Gmail SMTP
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER!, // your-email@gmail.com
          pass: process.env.EMAIL_APP_PASSWORD!, // App password (not regular password)
        },
      });

      // Verify connection configuration
      await this.transporter.verify();
      console.log(' Email service initialized successfully');
    } catch (error) {
      console.error('❌ Email service initialization failed:', error);
      throw error;
    }
  }

  private static async sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        await this.initialize();
      }

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'Medikonnect',
          address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER!
        },
        to,
        subject,
        html,
        text: html.replace(/<[^>]*>/g, ''), 
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(' Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
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
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f4f4f4; 
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
              background-color: #ffffff;
            }
            .header { 
              background: #007bff; 
              color: white; 
              padding: 20px; 
              text-align: center; 
              border-radius: 8px 8px 0 0; 
            }
            .content { 
              background: #f9f9f9; 
              padding: 30px; 
              border-radius: 0 0 8px 8px; 
            }
            .otp-box { 
              background: #fff; 
              border: 2px dashed #007bff; 
              padding: 20px; 
              text-align: center; 
              margin: 20px 0; 
              border-radius: 8px; 
            }
            .otp-code { 
              font-size: 32px; 
              font-weight: bold; 
              color: #007bff; 
              letter-spacing: 8px; 
              font-family: 'Courier New', monospace;
            }
            .warning { 
              color: #e74c3c; 
              font-size: 14px; 
              margin-top: 20px; 
              padding: 10px;
              background-color: #ffeaea;
              border-radius: 4px;
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              color: #666; 
              font-size: 12px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Email Verification Required</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>Thank you for registering your ${userType} account. To complete your registration, please verify your email address using the OTP below:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <p><strong>Enter this 6-digit code to verify your email</strong></p>
              </div>
              
              <p>⏰ <strong>This verification code will expire in 10 minutes.</strong></p>
              
              <div class="warning">
                <p><strong>🔒 Security Note:</strong> If you didn't request this verification, please ignore this email.</p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2025 ${process.env.EMAIL_FROM_NAME || 'Medikonnect'}. All rights reserved.</p>
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
    const subject = `🔑 Password Reset Request - ${userType === 'doctor' ? 'Doctor' : 'User'} Account`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f4f4f4; 
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
              background-color: #ffffff;
            }
            .header { 
              background: #e74c3c; 
              color: white; 
              padding: 20px; 
              text-align: center; 
              border-radius: 8px 8px 0 0; 
            }
            .content { 
              background: #f9f9f9; 
              padding: 30px; 
              border-radius: 0 0 8px 8px; 
            }
            .reset-button { 
              display: inline-block; 
              background: #e74c3c; 
              color: white !important; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0; 
              font-weight: bold; 
              font-size: 16px;
            }
            .reset-button:hover { 
              background: #c0392b; 
            }
            .warning { 
              color: #e74c3c; 
              font-size: 14px; 
              margin-top: 20px; 
              padding: 10px;
              background-color: #ffeaea;
              border-radius: 4px;
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              color: #666; 
              font-size: 12px; 
            }
            .url-box {
              word-break: break-all; 
              background: #fff; 
              padding: 15px; 
              border-radius: 4px; 
              font-family: 'Courier New', monospace;
              border: 1px solid #ddd;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔑 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>We received a request to reset your ${userType} account password. Click the button below to create a new password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetURL}" class="reset-button">Reset My Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <div class="url-box">
                ${resetURL}
              </div>
              
              <p>⏰ <strong>This reset link will expire in 10 minutes.</strong></p>
              
              <div class="warning">
                <p><strong>🔒 Security Note:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2025 ${process.env.EMAIL_FROM_NAME || 'Medikonnect'}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail({ to: email, subject, html });
  }

  // Send welcome email after successful verification
  static async sendWelcomeEmail(email: string, name: string, userType: 'user' | 'doctor'): Promise<boolean> {
    const subject = ` Welcome to Our Platform - ${userType === 'doctor' ? 'Doctor' : 'User'} Account Verified!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome!</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f4f4f4; 
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
              background-color: #ffffff;
            }
            .header { 
              background: #28a745; 
              color: white; 
              padding: 20px; 
              text-align: center; 
              border-radius: 8px 8px 0 0; 
            }
            .content { 
              background: #f9f9f9; 
              padding: 30px; 
              border-radius: 0 0 8px 8px; 
            }
            .cta-button { 
              display: inline-block; 
              background: #28a745; 
              color: white !important; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0; 
              font-weight: bold; 
              font-size: 16px;
            }
            .cta-button:hover {
              background: #218838;
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              color: #666; 
              font-size: 12px; 
            }
            .feature-list {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .feature-list li {
              margin: 10px 0;
              padding-left: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1> Welcome to Our Platform!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}! 👋</h2>
              <p><strong>Congratulations!</strong> Your ${userType} account has been successfully verified and is now active.</p>
              
              <div class="feature-list">
                <p><strong>You can now:</strong></p>
                <ul>
                  <li> Complete your profile</li>
                  <li> Access all platform features</li>
                  ${userType === 'doctor' 
                    ? '<li> Start managing your practice</li><li> Connect with patients</li>' 
                    : '<li> Book appointments with doctors</li><li> Access your health dashboard</li>'
                  }
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="cta-button">Go to Dashboard</a>
              </div>
              
              <p>If you have any questions, feel free to contact our support team.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 ${process.env.EMAIL_FROM_NAME || 'Medikonnect'}. All rights reserved.</p>
              <p>📧 Support: ${process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM_ADDRESS}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail({ to: email, subject, html });
  }

  // Test email function (useful for testing setup)
  // static async sendTestEmail(email: string): Promise<boolean> {
  //   const html = `
  //     <h2> Email Service Test</h2>
  //     <p>If you're reading this, your email service is working correctly!</p>
  //     <p>Sent at: ${new Date().toISOString()}</p>
  //   `;

  //   return await this.sendEmail({
  //     to: email,
  //     subject: ' Email Service Test',
  //     html
  //   });
  // }
}

export default EmailService;