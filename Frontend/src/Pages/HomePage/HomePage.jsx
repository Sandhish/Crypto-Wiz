import { useNavigate } from 'react-router-dom';
import styles from './HomePage.module.css';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.homePage}>
            <header className={styles.header}>
                <div className={styles.logo}>Crypto Wiz</div>
                <nav className={styles.nav}>
                    <button className={styles.loginBtn} onClick={() => navigate('/login')}>Login</button>
                </nav>
            </header>

            <main>
                <section className={styles.hero}>
                    <h1>Trade Crypto with Confidence</h1>
                    <p>Your trusted platform for cryptocurrency trading and investment</p>
                    <button className={styles.ctaButton} onClick={() => navigate('/signup')}>Get Started</button>
                </section>

                <section className={styles.liveMarket}>
                    <h2>Live Market</h2>
                    <div className={styles.marketGrid}>
                        <div className={styles.marketCard}>
                            <img src="https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/64/btc.png" alt="Bitcoin" className={styles.cryptoLogo} />
                            <div className={styles.cryptoInfo}>
                                <h3>Bitcoin</h3>
                                <p className={styles.price}>$97,735.67</p>
                                <span className={`${styles.change} ${styles.positive}`}>+1.45%</span>
                            </div>
                        </div>
                        <div className={styles.marketCard}>
                            <img src="https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/64/eth.png" alt="Ethereum" className={styles.cryptoLogo} />
                            <div className={styles.cryptoInfo}>
                                <h3>Ethereum</h3>
                                <p className={styles.price}>$2,275.12</p>
                                <span className={`${styles.change} ${styles.positive}`}>+0.96%</span>
                            </div>
                        </div>
                        <div className={styles.marketCard}>
                            <img src="https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/64/sol.png" alt="Binance Coin" className={styles.cryptoLogo} />
                            <div className={styles.cryptoInfo}>
                                <h3>Solana</h3>
                                <p className={styles.price}>$205.36</p>
                                <span className={`${styles.change} ${styles.negative}`}>-0.54%</span>
                            </div>
                        </div>
                        <div className={styles.marketCard}>
                            <img src="https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/64/doge.png" alt="DOGE" className={styles.cryptoLogo} />
                            <div className={styles.cryptoInfo}>
                                <h3>DOGE</h3>
                                <p className={styles.price}>$0.36</p>
                                <span className={`${styles.change} ${styles.positive}`}>+3.21%</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.features}>
                    <h2>Why Choose Crypto Wiz!</h2>
                    <div className={styles.featureGrid}>
                        <div className={styles.featureCard}>
                            <h3>Secure Trading</h3>
                            <p>Advanced security measures to protect your assets</p>
                        </div>
                        <div className={styles.featureCard}>
                            <h3>24/7 Support</h3>
                            <p>Round-the-clock customer support for all your needs</p>
                        </div>
                        <div className={styles.featureCard}>
                            <h3>Low Fees</h3>
                            <p>Competitive trading fees in the market</p>
                        </div>
                        <div className={styles.featureCard}>
                            <h3>Advanced Tools</h3>
                            <p>Professional trading tools and real-time analytics</p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div className={styles.footerSection}>
                        <h3>About</h3>
                        <ul>
                            <li>About Us</li>
                            <li>Careers</li>
                            <li>Press</li>
                        </ul>
                    </div>
                    <div className={styles.footerSection}>
                        <h3>Products</h3>
                        <ul>
                            <li>Exchange</li>
                            <li>Institutional</li>
                            <li>Learn</li>
                        </ul>
                    </div>
                    <div className={styles.footerSection}>
                        <h3>Support</h3>
                        <ul>
                            <li>Help Center</li>
                            <li>Contact Us</li>
                            <li>API Documentation</li>
                        </ul>
                    </div>
                </div>
                <div className={styles.footerBottom}>
                    <p>&copy; 2025 Crypto Wiz. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;

