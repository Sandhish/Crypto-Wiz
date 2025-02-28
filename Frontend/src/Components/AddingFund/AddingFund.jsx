import { useState } from 'react';
import { CreditCard, Check, X } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import styles from './AddingFund.module.css';

const stripePromise = loadStripe('pk_test_51Qx9jbQV0ALkosDI0adW25M4CBYipK9fBtZALtl1IMzQSiWvJJsXicOjioYb99cauGDand2uCiC9vIifjqggid4M00T7LUmGmo');

const cardElementOptions = {
    style: {
        base: {
            color: '#ffffff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '16px',
            '::placeholder': {
                color: '#aab7c4',
            },
            backgroundColor: 'transparent',
        },
        invalid: {
            color: '#fa755a',
            iconColor: '#fa755a',
        },
    },
};

const CheckoutForm = ({ onUpdateBalance, amount, setShowSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Please log in to add funds.');
            }

            if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
                throw new Error('Please enter a valid amount.');
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/portfolio/funds`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount: parseFloat(amount) * 100 })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create payment intent');
            }

            const { clientSecret } = await response.json();
            if (!clientSecret) {
                throw new Error('Failed to get client secret.');
            }

            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement)
                }
            });

            if (stripeError) {
                setError(stripeError.message);
                setLoading(false);
                return;
            }

            if (paymentIntent.status === 'succeeded') {
                setTimeout(refreshUserBalance, 2000);
                setShowSuccess(true);
            } else {
                setError('Payment processing failed. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            setError(error.message || 'An error occurred.');
        }

        setLoading(false);
    };

    const refreshUserBalance = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/portfolio/portfolio`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (typeof onUpdateBalance === 'function') {
                    onUpdateBalance(data.balance);
                }
            }
        } catch (error) {
            console.error('Error refreshing balance:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className={styles.cardElementContainer}>
                <CardElement options={cardElementOptions} />
            </div>
            <button type="submit" disabled={!stripe || loading} className={styles.paymentButton}>
                {loading ? (
                    <div className={styles.buttonContent}>
                        <div className={styles.spinner}></div>
                        Processing...
                    </div>
                ) : (
                    <div className={styles.buttonContent}>
                        <CreditCard className={styles.icon} />
                        Pay Now
                    </div>
                )}
            </button>
            {error && <div className={styles.errorAlert}><p>{error}</p></div>}
        </form>
    );
};

const DepositFunds = ({ onUpdateBalance = () => { }, currentBalance = 0 }) => {
    const [amount, setAmount] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
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

                            <Elements stripe={stripePromise}>
                                <CheckoutForm amount={amount} onUpdateBalance={onUpdateBalance} setShowSuccess={setShowSuccess} />
                            </Elements>
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