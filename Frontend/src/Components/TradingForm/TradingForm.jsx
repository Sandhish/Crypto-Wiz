import { useState, useEffect } from 'react';
import styles from './TradingForm.module.css';
import Notification from '../Notification/Notification';
import { Loader2 } from 'lucide-react';

const TradingForm = ({ symbol, currentPrice }) => {
  const [quantity, setQuantity] = useState('');
  const [orderType, setOrderType] = useState('buy');
  const [total, setTotal] = useState(0);
  const [focus, setFocus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({
    isVisible: false,
    message: '',
    type: ''
  });

  useEffect(() => {
    setTotal(quantity * currentPrice);
  }, [quantity, currentPrice]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (parseFloat(quantity) <= 0) {
      setNotification({
        isVisible: true,
        message: 'Quantity must be greater than zero.',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/portfolio/${orderType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          symbol,
          quantity: parseFloat(quantity),
          price: currentPrice
        })
      });

      const data = await response.json();
      if (response.ok) {
        setNotification({
          isVisible: true,
          message: `Successfully ${orderType === 'buy' ? 'purchased' : 'sold'} ${quantity} ${symbol} at $${currentPrice.toFixed(2)}`,
          type: orderType
        });
        setQuantity('');
      } else {
        setNotification({
          isVisible: true,
          message: data.message || 'Failed to execute trade.',
          type: 'error'
        });
      }
    } catch (error) {
      setNotification({
        isVisible: true,
        message: 'Error executing trade. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  return (
    <div className={styles.formContainer}>
      <Notification isVisible={notification.isVisible} message={notification.message} type={notification.type} onClose={closeNotification} />

      <div className={styles.tradingForm}>
        <div className={styles.formHeader}>
          <h3>Trade {symbol}</h3>
          <div className={styles.orderTypeContainer}>
            <div className={styles.orderTypeButtons}>
              <button type="button" onClick={() => setOrderType('buy')} disabled={isLoading}
                className={`${styles.orderTypeButton} ${orderType === 'buy' ? styles.buyActive : ''}`} >
                Buy
              </button>
              <button type="button" onClick={() => setOrderType('sell')} disabled={isLoading}
                className={`${styles.orderTypeButton} ${orderType === 'sell' ? styles.sellActive : ''}`} >
                Sell
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.sideBySideContainer}>
            <div className={`${styles.inputContainer} ${focus === 'quantity' ? styles.focused : ''}`}>
              <label>Quantity</label>
              <div className={styles.inputWrapper}>
                <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                  onFocus={() => setFocus('quantity')}  onBlur={() => setFocus(null)}
                  min="0" step="0.0001" required placeholder="0.00" disabled={isLoading}
                />
                <span className={styles.symbolLabel}>{symbol}</span>
              </div>
            </div>

            <div className={styles.totalPreview}>
              <label>Total</label>
              <div className={styles.previewValue}>${total.toFixed(2)}</div>
            </div>

            <div className={styles.pricePreview}>
              <label>Price</label>
              <div className={styles.previewValue}>${currentPrice.toFixed(2)}</div>
            </div>
          </div>

          <button type="submit" className={`${styles.submitButton} ${orderType === 'buy' ? styles.buyButton : styles.sellButton}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className={styles.loadingContainer}>
                <Loader2 className={styles.loadingSpinner} />
                {orderType === 'buy' ? 'Buying' : 'Selling'} {symbol}...
              </span>
            ) : (
              `${orderType === 'buy' ? 'Buy' : 'Sell'} ${symbol}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TradingForm;