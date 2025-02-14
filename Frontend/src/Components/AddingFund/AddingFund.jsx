import { useState } from 'react';
import { CreditCard, Wallet, ArrowRight, Check, X } from 'lucide-react';
import styles from './AddingFund.module.css';

const DepositFunds = ({ onUpdateBalance = () => { }, currentBalance = 0 }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState('');

    const handlePayment = async () => {
        if (!amount || isNaN(parseFloat(amount))) {
            setError('Please enter a valid amount');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Please log in to add funds.');
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/portfolio/funds`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: parseFloat(amount)
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to process payment.');
            }

            const result = await response.json();

            if (typeof onUpdateBalance === 'function') {
                onUpdateBalance(result.newBalance);
            }

            setShowSuccess(true);
            setAmount('');
        } catch (error) {
            console.error('Error processing payment:', error);
            setError(error.message || 'An error occurred while processing the payment.');
        }

        setLoading(false);
    };

    const presetAmounts = [100, 500, 1000, 5000];

    return (
        <div className={styles.depositContainer}>
            <div className={styles.depositCard}>
                <div className={styles.cardHeader}>
                    <h2>Add Funds</h2>
                    <button className={styles.closeButton} onClick={() => setShowSuccess(false)} aria-label="Close" >
                        <X className={styles.icon} />
                    </button>
                </div>
                <div className={styles.cardContent}>
                    {error && (
                        <div className={styles.errorAlert}>
                            <p>{error}</p>
                        </div>
                    )}
                    {!showSuccess ? (
                        <div className={styles.depositForm}>
                            <div className={styles.inputGroup}>
                                <label>Amount (USD)</label>
                                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Enter amount" />
                            </div>

                            <div className={styles.presetAmounts}>
                                {presetAmounts.map((preset) => (
                                    <button key={preset} onClick={() => setAmount(preset.toString())} className={styles.presetButton} >
                                        ${preset}
                                    </button>
                                ))}
                            </div>

                            <div className={styles.summaryBox}>
                                <div className={styles.summaryRow}>
                                    <div className={styles.summaryLabel}>
                                        <Wallet className={styles.icon} />
                                        <span>Amount</span>
                                    </div>
                                    <span>${amount || '0.00'}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <div className={styles.summaryLabel}>
                                        <CreditCard className={styles.icon} />
                                        <span>Processing Fee</span>
                                    </div>
                                    <span>${amount ? (parseFloat(amount) * 0.015).toFixed(2) : '0.00'}</span>
                                </div>
                                <div className={`${styles.summaryRow} ${styles.total}`}>
                                    <span>Total</span>
                                    <span>${amount ? (parseFloat(amount) * 1.015).toFixed(2) : '0.00'}</span>
                                </div>
                            </div>

                            <button onClick={handlePayment} disabled={!amount || loading}
                                className={`${styles.paymentButton} ${loading ? styles.loading : ''}`} >
                                {loading ? (
                                    <div className={styles.spinner}></div>
                                ) : (
                                    <div className={styles.buttonContent}>
                                        <span>Continue to Payment</span>
                                        <ArrowRight className={styles.icon} />
                                    </div>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className={styles.successAlert}>
                            <Check className={styles.icon} />
                            <p>Payment successful! Funds have been added to your account.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DepositFunds;
