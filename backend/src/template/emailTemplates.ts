// templates/emailTemplates.ts

interface VerificationEmailData {
  otp: string;
  userType: 'user' | 'doctor';
}

interface PasswordResetEmailData {
  resetURL: string;
  userType: 'user' | 'doctor';
}

interface WelcomeEmailData {
  name: string;
  userType: 'user' | 'doctor';
  dashboardURL: string;
}

export class EmailTemplates {
  private static getBaseStyles(): string {
    return `
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
        .button { 
          display: inline-block; 
          color: white !important; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0; 
          font-weight: bold; 
          font-size: 16px;
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
    `;
  }

  private static getFooter(): string {
    const appName = process.env.EMAIL_FROM_NAME || 'Medikonnect';
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM_ADDRESS;
    
    return `
      <div class="footer">
        <p>&copy; 2025 ${appName}. All rights reserved.</p>
        ${supportEmail ? `<p>📧 Support: ${supportEmail}</p>` : ''}
      </div>
    `;
  }

  static verificationOTP(data: VerificationEmailData): { subject: string; html: string } {
    const { otp, userType } = data;
    const subject = `Verify Your Email - ${userType === 'doctor' ? 'Doctor' : 'User'} Account`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          ${this.getBaseStyles()}
          <style>
            .header { background: #007bff; }
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1> Email Verification Required</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>Thank you for registering your ${userType} account. To complete your registration, please verify your email address using the OTP below:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <p><strong>Enter this 6-digit code to verify your email</strong></p>
              </div>
              
              <p> <strong>This verification code will expire in 10 minutes.</strong></p>
              
              <div class="warning">
                <p><strong> Security Note:</strong> If you didn't request this verification, please ignore this email.</p>
              </div>
            </div>
            ${this.getFooter()}
          </div>
        </body>
      </html>
    `;

    return { subject, html };
  }

  static passwordReset(data: PasswordResetEmailData): { subject: string; html: string } {
    const { resetURL, userType } = data;
    const subject = `Password Reset Request - ${userType === 'doctor' ? 'Doctor' : 'User'} Account`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          ${this.getBaseStyles()}
          <style>
            .header { background: #e74c3c; }
            .button { background: #e74c3c; }
            .button:hover { background: #c0392b; }
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
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>We received a request to reset your ${userType} account password. Click the button below to create a new password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetURL}" class="button">Reset My Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <div class="url-box">
                ${resetURL}
              </div>
              
              <p> <strong>This reset link will expire in 10 minutes.</strong></p>
              
              <div class="warning">
                <p><strong> Security Note:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              </div>
            </div>
            ${this.getFooter()}
          </div>
        </body>
      </html>
    `;

    return { subject, html };
  }

  static welcome(data: WelcomeEmailData): { subject: string; html: string } {
    const { name, userType, dashboardURL } = data;
    const subject = `Welcome to Our Platform - ${userType === 'doctor' ? 'Doctor' : 'User'} Account Verified!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome!</title>
          ${this.getBaseStyles()}
          <style>
            .header { background: #28a745; }
            .button { background: #28a745; }
            .button:hover { background: #218838; }
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
              <h1>Welcome to Our Platform!</h1>
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
                <a href="${dashboardURL}" class="button">Go to Dashboard</a>
              </div>
              
              <p>If you have any questions, feel free to contact our support team.</p>
            </div>
            ${this.getFooter()}
          </div>
        </body>
      </html>
    `;

    return { subject, html };
  }

  // static test(email: string): { subject: string; html: string } {
  //   const subject = '🧪 Email Service Test';
  //   const html = `
  //     <!DOCTYPE html>
  //     <html>
  //       <head>
  //         <meta charset="utf-8">
  //         <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //         <title>Test Email</title>
  //         ${this.getBaseStyles()}
  //         <style>
  //           .header { background: #6c757d; }
  //         </style>
  //       </head>
  //       <body>
  //         <div class="container">
  //           <div class="header">
  //             <h1>🧪 Email Service Test</h1>
  //           </div>
  //           <div class="content">
  //             <h2>Test Successful!</h2>
  //             <p>If you're reading this, your email service is working correctly!</p>
  //             <p><strong>Test Details:</strong></p>
  //             <ul>
  //               <li>Recipient: ${email}</li>
  //               <li>Sent at: ${new Date().toISOString()}</li>
  //               <li>Service: Working </li>
  //             </ul>
  //           </div>
  //           ${this.getFooter()}
  //         </div>
  //       </body>
  //     </html>
  //   `;

  //   return { subject, html };
  // }
}