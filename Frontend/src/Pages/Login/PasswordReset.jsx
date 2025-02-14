import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOTP, verifyOTP, updatePassword } from '../../Services/authService';
import { Lock, Shield, Mail } from 'lucide-react';
import styles from './Login.module.css';
import OTPInput from './OTPInput';

const PasswordReset = () => {
    const [formData, setFormData] = useState({
        email: '',
        otp: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setError('');
    };

    const handleSendOTP = async (e) => {
        e?.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await sendOTP(formData.email);
            setSuccess('OTP has been sent to your email');
            setOtpSent(true);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to send OTP');
            console.error('Send OTP Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await verifyOTP(formData.email, formData.otp);
            setSuccess('OTP verified successfully');
            setOtpVerified(true);
        } catch (error) {
            setError(error.response?.data?.message || 'Invalid OTP');
            console.error('Verify OTP Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendSuccess = (message) => {
        setSuccess(message);
        setError('');
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleResendError = (message) => {
        setError(message);
        setSuccess('');
        setTimeout(() => setError(''), 3000);
    };

    const validatePassword = () => {
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!validatePassword()) return;

        setIsLoading(true);
        try {
            await updatePassword(formData.email, formData.otp, formData.password);
            setSuccess('Password has been successfully reset');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authBackground}>
                <div className={styles.gradientOverlay}></div>
                <div className={styles.gridPattern}></div>
            </div>

            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <Shield className={styles.authIcon} size={28} />
                    <h2>
                        {!otpSent ? 'Reset Password' :
                            !otpVerified ? 'Enter OTP' :
                                'Create New Password'}
                    </h2>
                    <p>
                        {!otpSent ? 'Enter your email to receive OTP' :
                            !otpVerified ? 'Enter the OTP sent to your email' :
                                'Please enter your new password'}
                    </p>
                </div>

                {error && (
                    <div className={styles.errorAlert}>
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className={styles.successAlert}>
                        <span>{success}</span>
                    </div>
                )}

                {!otpSent ? (
                    <form onSubmit={handleSendOTP} className={styles.authForm}>
                        <div className={styles.inputGroup}>
                            <Mail className={styles.inputIcon} size={18} />
                            <input type="email" name="email" placeholder="Enter your email" value={formData.email}
                                onChange={handleInputChange} required disabled={isLoading} />
                        </div>

                        <button type="submit" className={styles.authButton} disabled={isLoading} >
                            {isLoading ? 'Sending...' : 'Send OTP'}
                        </button>

                        <button type="button" onClick={() => navigate('/login')}
                            className={`${styles.authButton} ${styles.secondaryButton}`} disabled={isLoading} >
                            Back to Login
                        </button>
                    </form>
                ) : !otpVerified ? (
                    <form onSubmit={handleVerifyOTP} className={styles.authForm}>
                        <OTPInput length={6} value={formData.otp}
                            onChange={(value) => setFormData({ ...formData, otp: value })}
                            email={formData.email}
                            onResendSuccess={handleResendSuccess}
                            onResendError={handleResendError}
                            onResend={handleSendOTP}
                        />

                        <button type="submit" className={styles.authButton} disabled={isLoading || formData.otp.length !== 6} >
                            {isLoading ? 'Verifying...' : 'Verify OTP'}
                        </button>

                        <button type="button" onClick={() => setOtpSent(false)}
                            className={`${styles.authButton} ${styles.secondaryButton}`} disabled={isLoading} >
                            Back
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className={styles.authForm}>
                        <div className={styles.inputGroup}>
                            <Lock className={styles.inputIcon} size={18} />
                            <input type="password" name="password" placeholder="New Password" value={formData.password}
                                onChange={handleInputChange} required disabled={isLoading} />
                        </div>

                        <div className={styles.inputGroup}>
                            <Lock className={styles.inputIcon} size={18} />
                            <input type="password" name="confirmPassword" placeholder="Confirm New Password"
                                value={formData.confirmPassword} onChange={handleInputChange}
                                required disabled={isLoading} />
                        </div>

                        <button type="submit" className={styles.authButton} disabled={isLoading}>
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default PasswordReset;