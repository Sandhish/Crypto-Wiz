const nodemailer = require('nodemailer');

const sendOTPEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>You have requested to reset your password. Please use the following OTP to complete your password reset:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px;">
                        <strong>${otp}</strong>
                    </div>
                    <p>This OTP will expire in 15 minutes.</p>
                    <p>If you didn't request this password reset, please ignore this email.</p>
                    <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send OTP email');
    }
};

module.exports = sendOTPEmail;