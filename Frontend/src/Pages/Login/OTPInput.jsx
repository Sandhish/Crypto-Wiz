import { useState, useRef, useEffect } from 'react';
import styles from './Login.module.css';

const OTPInput = ({ length = 6, value, onChange, email, onResendSuccess, onResendError, onResend }) => {
    const [otp, setOtp] = useState(new Array(length).fill(""));
    const inputRefs = useRef([]);
    const [timeLeft, setTimeLeft] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else {
            setCanResend(true);
        }
    }, [timeLeft]);

    useEffect(() => {
        onChange(otp.join(""));
    }, [otp]);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;

        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

        if (element.value && index < length - 1) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace") {
            if (!otp[index] && index > 0) {
                inputRefs.current[index - 1].focus();
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').slice(0, length).split('');

        if (pasteData) {
            let updatedOTP = [...otp];
            pasteData.forEach((value, index) => {
                if (index < length && !isNaN(value)) {
                    updatedOTP[index] = value;
                }
            });
            setOtp(updatedOTP);

            const lastFilledIndex = updatedOTP.findLastIndex(val => val !== "");
            const focusIndex = lastFilledIndex < length - 1 ? lastFilledIndex + 1 : lastFilledIndex;
            inputRefs.current[focusIndex].focus();
        }
    };

    const handleResendOTP = async () => {
        if (!email || isResending) return;

        setIsResending(true);
        try {
            await onResend();
            setTimeLeft(30);
            setCanResend(false);
            if (typeof onResendSuccess === 'function') {
                onResendSuccess('OTP has been resent to your email');
            }
            setOtp(new Array(length).fill(""));
            inputRefs.current[0].focus();
        } catch (error) {
            if (typeof onResendError === 'function') {
                onResendError(error.response?.data?.message || 'Failed to resend OTP');
            }
            setCanResend(true);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div>
            <div className={styles.otpGroup}>
                {otp.map((data, index) => (
                    <input key={index} type="number" ref={el => inputRefs.current[index] = el}
                        value={data} onChange={e => handleChange(e.target, index)}
                        onKeyDown={e => handleKeyDown(e, index)}
                        onPaste={handlePaste} className={styles.otpInput}
                        maxLength={1} disabled={isResending} />
                ))}
            </div>
            <div className={styles.resendTimer}>
                {timeLeft > 0 ? (
                    <span>Resend OTP in {timeLeft}s</span>
                ) : (
                    <button className={styles.resendButton} onClick={handleResendOTP} disabled={!canResend || isResending} >
                        {isResending ? 'Sending...' : 'Resend OTP'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default OTPInput;