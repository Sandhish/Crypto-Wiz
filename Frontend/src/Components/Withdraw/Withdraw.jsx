import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Withdraw.module.css';
import { useNavigate } from 'react-router-dom';

const Withdraw = () => {
    const navigate = useNavigate();
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [progressWidth, setProgressWidth] = useState(0);

    useEffect(() => {
        if (isLoading) {
            const interval = setInterval(() => {
                setProgressWidth(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + 5;
                });
            }, 50);
            
            return () => clearInterval(interval);
        } else {
            setProgressWidth(0);
        }
    }, [isLoading]);

    const handleWithdraw = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        if (!amount || isNaN(amount) || amount <= 0) {
            setError('Please enter a valid withdrawal amount.');
            setIsLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_BACKEND_API}/api/portfolio/withdraw`, {
                amount: parseFloat(amount)
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setSuccess(`Successfully withdrew $${parseFloat(amount).toFixed(2)} from your account.`);
            setAmount('');
            setIsLoading(false);
        } catch (err) {
            setError('Withdrawal failed. Please check your balance and try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.withdrawContainer}>
            <div className={styles.withdrawCard}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.withdrawHeader}>Withdraw Funds</h2>
                </div>
                <div className={styles.cardContent}>
                    <form onSubmit={handleWithdraw} className={styles.withdrawForm}>
                        <div className={styles.amountContainer}>
                            <label htmlFor="amount" className={styles.label}>Withdrawal Amount</label>
                            <span className={styles.currencySymbol}>$</span>
                            <input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00" className={styles.withdrawInput} step="0.01" min="0" />
                        </div>
                        
                        <div className={styles.safetyMessage}>
                            Funds will be sent to your registered bank account within 1-3 business days.
                        </div>
                        
                        <button type="submit" className={styles.withdrawButton} disabled={isLoading} >
                            <div className={styles.buttonContent}>
                                {isLoading ? (
                                    <span className={styles.spinner}></span>
                                ) : null}
                                {isLoading ? 'Processing...' : 'Withdraw Funds'}
                            </div>
                        </button>
                        
                        {isLoading && (
                            <div className={styles.withdrawProgress}>
                                <div 
                                    className={styles.progressBar} 
                                    style={{ width: `${progressWidth}%` }}
                                />
                            </div>
                        )}
                        
                        {error && <div className={styles.errorMessage}>{error}</div>}
                        {success && <div className={styles.successMessage}>{success}</div>}
                        
                        <button type="button" onClick={() => navigate('/user')} className={styles.backButton} >
                            Return to Dashboard
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Withdraw;