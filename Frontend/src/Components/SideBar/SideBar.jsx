import { useState, useEffect } from 'react';
import { X, Wallet, PlusCircle, LineChart, BookMarked, LogOut, User } from 'lucide-react';
import styles from './SideBar.module.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState({
        username: '',
        email: '',
        balance: 0,
        portfolio: []
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_API}/api/user/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setUserData(response.data);
            } catch (error) {
                console.error('Error fetching user data:', error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('cryptoListPage');
        navigate('/');
        onClose();
    };

    const menuItems = [
        {
            icon: User,
            label: loading ? 'Loading...' : userData.email,
            className: 'profile',
        },
        {
            icon: Wallet,
            label: loading ? 'Loading...' : `Balance: $${userData.balance.toFixed(2)}`,
            className: 'balance'
        },
        {
            icon: PlusCircle,
            label: 'Add Funds',
            className: 'addFunds',
            onClick: () => {
                navigate('/funds');
                onClose();
            }
        },
        {
            icon: LineChart,
            label: 'Portfolio',
            className: 'portfolio',
            onClick: () => {
                navigate('/portfolio');
                onClose();
            }
        },
        {
            icon: BookMarked,
            label: 'Watchlist',
            className: 'watchlist',
            onClick: () => {
                navigate('/watchlist');
                onClose();
            }
        },
        {
            icon: LogOut,
            label: 'Logout',
            className: 'logout',
            onClick: handleLogout,
            iconClassName: `${styles.logoutIcon}`,
            labelClassName: `${styles.logoutLabel}`
        }
    ];

    return (
        <>
            <div className={`${styles.sidebarOverlay} ${isOpen ? styles.sidebarOverlayActive : ''}`} onClick={onClose} />

            <div className={`${styles.accountSidebar} ${isOpen ? styles.accountSidebarActive : ''}`}>
                <div className={styles.sidebarHeader}>
                    <h2 className={styles.sidebarHeaderH2}>Account</h2>
                    <button className={`${styles.closeButton} ${styles.closeButtonHover}`} onClick={onClose} >
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.usernameSection}>
                    <p className={styles.username}>
                        {loading ? 'Loading...' : userData.name}
                    </p>
                    <p className={styles.email}>
                        {loading ? 'Loading...' : userData.username}
                    </p>
                </div>

                <div className={styles.menuItems}>
                    {menuItems.map((item, index) => (
                        <button
                            key={index}
                            className={`${styles.menuItem} ${styles[item.className]}`}
                            onClick={item.onClick}
                            disabled={item.className === 'balance' || loading}
                        >
                            <item.icon className={`${styles.menuItemIcon} ${item.iconClassName || ''}`} />
                            <span className={`${styles.menuItemLabel} ${item.labelClassName || ''}`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>

            </div>
        </>
    );
};

export default Sidebar;
