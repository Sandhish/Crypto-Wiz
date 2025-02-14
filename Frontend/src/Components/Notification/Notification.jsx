import styles from './Notification.module.css';

const Notification = ({ message, type, isVisible, onClose }) => {

    if (!isVisible) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={styles.notificationOverlay} onClick={handleOverlayClick}>
            <div className={styles.notificationCard}>
                <button className={styles.notificationClose} onClick={onClose} aria-label="Close notification" />
                <div className={styles.notificationIcon}>
                    {type === 'buy' ? (
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    ) : type === 'sell' ? (
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                strokeWidth="2" d="M5 13l4 4L19 7"
                            />
                        </svg>
                    ) : (
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    )}
                </div>

                <h3 className={styles.notificationTitle}>
                    {type === 'buy' ? 'Purchase Successful!' : type === 'sell' ? 'Sale Successful!' : 'Error'}
                </h3>
                <p className={styles.notificationMessage}>{message}</p>
            </div>
        </div>
    );
};

export default Notification;