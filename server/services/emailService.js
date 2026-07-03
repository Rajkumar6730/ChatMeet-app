const nodemailer = require('nodemailer');

/**
 * Email Service
 * Handles email sending for verification and password reset
 */

// Create transporter based on environment
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Use production email service (SendGrid, AWS SES, etc.)
    // This is an example with a generic SMTP server
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Development: use a test email service or local mailbox
    // For development, consider using Mailtrap or similar
    return nodemailer.createTransport({
      host: 'localhost',
      port: 1025, // Local mail service port
      ignoreTLS: true
    });
  }
};

const transporter = createTransporter();

/**
 * Send verification email
 */
exports.sendVerificationEmail = async (email, username, verificationToken) => {
  try {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@chatapp.com',
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <h2>Welcome to MessageMate, ${username}!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verifyUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email
        </a>
        <p style="margin-top: 20px; color: #666;">Or copy and paste this link:</p>
        <p style="word-break: break-all; color: #666;">${verifyUrl}</p>
        <p style="margin-top: 20px; color: #999; font-size: 12px;">
          This link will expire in 24 hours.
        </p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

/**
 * Send password reset email
 */
exports.sendPasswordResetEmail = async (email, username, resetToken) => {
  try {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@chatapp.com',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${username},</p>
        <p>We received a request to reset your password. Click the link below to set a new password:</p>
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
        <p style="margin-top: 20px; color: #666;">Or copy and paste this link:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p style="margin-top: 20px; color: #999; font-size: 12px;">
          This link will expire in 1 hour.
        </p>
        <p style="margin-top: 20px; color: #999; font-size: 12px;">
          If you didn't request this, please ignore this email.
        </p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

/**
 * Verify transporter connection (optional, for testing)
 */
exports.verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Email service connection failed:', error);
    return false;
  }
};

module.exports = exports;
