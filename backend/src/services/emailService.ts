// services/emailService.ts
import nodemailer from 'nodemailer';
import { EmailTemplates } from '../template/emailTemplates';


interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private static transporter: nodemailer.Transporter;
  private static isInitialized: boolean = false;

  // Initialize the transporter (call this once when your app starts)
  static async initialize() {
    try {
      // Validate required environment variables
      if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        throw new Error('Missing required environment variables: EMAIL_USER or EMAIL_APP_PASSWORD');
      }

      console.log('🔄 Initializing email service...');

      // Create transporter with your email provider settings
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
        // Add timeout configurations
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000,   // 30 seconds  
        socketTimeout: 60000,     // 60 seconds
        // Enable debug for troubleshooting (remove in production)
        debug: process.env.NODE_ENV === 'development',
        logger: process.env.NODE_ENV === 'development',
      });

      // Verify connection configuration with timeout
      const verifyPromise = this.transporter.verify();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email verification timeout')), 30000)
      );

      await Promise.race([verifyPromise, timeoutPromise]);
      
      this.isInitialized = true;
      console.log('Email service initialized successfully');
      console.log(`Using email: ${process.env.EMAIL_USER}`);
      
    } catch (error: any) {
      this.isInitialized = false;
      console.error(' Email service initialization failed:', error.message);
      
      // Provide helpful error messages based on common issues
      if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        console.error('    Troubleshooting tips:');
        console.error('   1. Check your internet connection');
        console.error('   2. Verify Gmail SMTP is accessible from your network');
        console.error('   3. Check if your firewall/antivirus is blocking port 587/465');
        console.error('   4. Try using a different network');
      } else if (error.message.includes('authentication') || error.code === 535) {
        console.error('   Authentication issue:');
        console.error('   1. Verify EMAIL_USER is correct');
        console.error('   2. Ensure EMAIL_APP_PASSWORD is a Gmail App Password (not regular password)');
        console.error('   3. Enable 2-factor authentication and generate App Password');
      }
      
      throw error;
    }
  }

  // Check if service is ready
  static isReady(): boolean {
    return Boolean(this.isInitialized && this.transporter);
  }

  // Private method to send email
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
        text: html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error(' Email sending failed:', error);
      return false;
    }
  }

  // Public methods using templates
  static async sendVerificationOTP(email: string, otp: string, userType: 'user' | 'doctor'): Promise<boolean> {
    const { subject, html } = EmailTemplates.verificationOTP({ otp, userType });
    return await this.sendEmail({ to: email, subject, html });
  }

  static async sendPasswordResetLink(email: string, resetToken: string, userType: 'user' | 'doctor'): Promise<boolean> {
    const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&type=${userType}`;
    const { subject, html } = EmailTemplates.passwordReset({ resetURL, userType });
    return await this.sendEmail({ to: email, subject, html });
  }

  static async sendWelcomeEmail(email: string, name: string, userType: 'user' | 'doctor'): Promise<boolean> {
    const dashboardURL = `${process.env.FRONTEND_URL}/dashboard`;
    const { subject, html } = EmailTemplates.welcome({ name, userType, dashboardURL });
    return await this.sendEmail({ to: email, subject, html });
  }

  // Test email function (useful for testing setup)
  // static async sendTestEmail(email: string): Promise<boolean> {
  //   const { subject, html } = EmailTemplates.test(email);
  //   return await this.sendEmail({ to: email, subject, html });
  // }

  // Test email connection without throwing errors
  static async testConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        await this.initialize();
      }
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }

  // Graceful shutdown
  static async shutdown() {
    if (this.transporter) {
      this.transporter.close();
      this.isInitialized = false;
      console.log('📧 Email service shut down');
    }
  }
}

export default EmailService;