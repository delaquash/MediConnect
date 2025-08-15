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
      console.log(`📧 Email User: ${process.env.EMAIL_USER}`);
      console.log(`🔑 Password length: ${process.env.EMAIL_APP_PASSWORD?.length} characters`);

      // Try different SMTP configurations
      const configs = [
        // Configuration 1: Gmail with explicit settings
        {
          name: 'Gmail SMTP (587)',
          config: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_APP_PASSWORD,
            },
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            socketTimeout: 10000,
            debug: true,
            logger: true,
          }
        },
        // Configuration 2: Gmail with SSL (465)
        {
          name: 'Gmail SMTP (465)',
          config: {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_APP_PASSWORD,
            },
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            socketTimeout: 10000,
            debug: true,
            logger: true,
          }
        },
        // Configuration 3: Gmail service (original)
        {
          name: 'Gmail Service',
          config: {
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_APP_PASSWORD,
            },
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            socketTimeout: 10000,
            debug: true,
            logger: true,
          }
        }
      ];

      // Try each configuration
      for (const { name, config } of configs) {
        try {
          console.log(`🔄 Trying ${name}...`);
          
          this.transporter = nodemailer.createTransport(config);

          // Test the connection with a shorter timeout
          const verifyPromise = this.transporter.verify();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${name} verification timeout`)), 15000)
          );

          await Promise.race([verifyPromise, timeoutPromise]);
          
          this.isInitialized = true;
          console.log(`✅ Email service initialized successfully with ${name}`);
          console.log(`📧 Using email: ${process.env.EMAIL_USER}`);
          return; // Success, exit the loop
          
        } catch (configError: any) {
          console.log(`❌ ${name} failed: ${configError.message}`);
          continue; // Try next configuration
        }
      }

      // If we reach here, all configurations failed
      throw new Error('All SMTP configurations failed');
      
    } catch (error: any) {
      this.isInitialized = false;
      console.error('❌ Email service initialization failed:', error.message);
      
      // Provide helpful error messages based on common issues
      if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        console.error('🔍 Connection Timeout Troubleshooting:');
        console.error('   1. Check your internet connection');
        console.error('   2. Try connecting to Gmail manually in browser');
        console.error('   3. Check if corporate firewall blocks SMTP (ports 587/465)');
        console.error('   4. Try running on different network (mobile hotspot)');
        console.error('   5. Temporarily disable antivirus/firewall');
      } else if (error.message.includes('authentication') || error.code === 535) {
        console.error('🔍 Authentication Troubleshooting:');
        console.error('   1. Verify EMAIL_USER is your full Gmail address');
        console.error('   2. Ensure EMAIL_APP_PASSWORD is 16-character App Password');
        console.error('   3. Enable 2-factor authentication on Gmail');
        console.error('   4. Generate new App Password in Gmail settings');
        console.error('   5. Check if "Less secure app access" is disabled (should be)');
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.error('🔍 Network/DNS Issues:');
        console.error('   1. Check DNS resolution: ping smtp.gmail.com');
        console.error('   2. Try different DNS servers (8.8.8.8, 1.1.1.1)');
        console.error('   3. Check if VPN is interfering');
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
      console.error('❌ Email sending failed:', error);
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
  static async sendTestEmail(email: string): Promise<boolean> {
    const { subject, html } = EmailTemplates.test(email);
    return await this.sendEmail({ to: email, subject, html });
  }

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

  // Network connectivity test
  static async testNetworkConnectivity(): Promise<void> {
    const net = require('net');
    
    const testPorts = [
      { host: 'smtp.gmail.com', port: 587, name: 'SMTP TLS' },
      { host: 'smtp.gmail.com', port: 465, name: 'SMTP SSL' },
    ];

    console.log('🔍 Testing network connectivity...');
    
    for (const { host, port, name } of testPorts) {
      try {
        await new Promise((resolve, reject) => {
          const socket = net.createConnection({ host, port, timeout: 5000 });
          socket.on('connect', () => {
            console.log(`✅ ${name} (${host}:${port}) - Connected`);
            socket.destroy();
            resolve(true);
          });
          socket.on('timeout', () => {
            console.log(`❌ ${name} (${host}:${port}) - Timeout`);
            socket.destroy();
            reject(new Error('Timeout'));
          });
          socket.on('error', (error: any) => {
            console.log(`❌ ${name} (${host}:${port}) - Error: ${error.message}`);
            reject(error);
          });
        });
      } catch (error: any) {
        console.log(`❌ ${name} connection failed: ${error.message}`);
      }
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