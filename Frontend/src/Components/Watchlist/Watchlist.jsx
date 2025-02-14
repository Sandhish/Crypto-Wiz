import { useEffect, useState } from 'react';
import { useWatchlist } from '../../Services/Watchlist';
import { Star, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './Watchlist.module.css';

const Watchlist = () => {
    const { watchlist, removeFromWatchlist, loading: watchlistLoading } = useWatchlist();
    const [priceData, setPriceData] = useState({});
    const [priceLoading, setPriceLoading] = useState(true);
    const navigate = useNavigate();
    const [ws, setWs] = useState(null);
    const WS_API_KEY = import.meta.env.VITE_WS_API;

    useEffect(() => {
        const setupWebSocket = () => {
            const newWs = new WebSocket(WS_API_KEY);

            newWs.onopen = () => {
                console.log('WebSocket Connected');
                watchlist.forEach(item => {
                    newWs.send(JSON.stringify({
                        type: 'subscribe',
                        symbol: `${item.symbol}USDT`
                    }));
                });
            };

            newWs.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'price_update') {
                        const symbol = data.symbol.replace('USDT', '');
                        setPriceData(prev => ({
                            ...prev,
                            [symbol]: {
                                price: data.price,
                                priceChange: data.percentageChange
                            }
                        }));
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            newWs.onclose = () => {
                console.log('WebSocket Disconnected');
                setTimeout(setupWebSocket, 5000);
            };

            setWs(newWs);
        };

        if (!watchlistLoading && watchlist.length > 0) {
            setupWebSocket();

            const fetchInitialPrices = async () => {
                setPriceLoading(true);
                try {
                    const symbols = watchlist.map(item => `${item.symbol}USDT`);
                    const promises = symbols.map(symbol =>
                        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
                            .then(res => res.json())
                    );

                    const results = await Promise.all(promises);
                    const priceObject = {};

                    results.forEach(result => {
                        const symbol = result.symbol.replace('USDT', '');
                        priceObject[symbol] = {
                            price: parseFloat(result.lastPrice),
                            priceChange: parseFloat(result.priceChangePercent)
                        };
                    });

                    setPriceData(priceObject);
                } catch (error) {
                    console.error('Error fetching initial price data:', error);
                } finally {
                    setPriceLoading(false);
                }
            };

            fetchInitialPrices();
        } else if (!watchlistLoading && watchlist.length === 0) {
            setPriceLoading(false);
        }

        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, [watchlist, watchlistLoading]);

    const handleRemove = async (e, symbol) => {
        e.stopPropagation();
        await removeFromWatchlist(symbol);
    };

    const handleRowClick = (symbol) => {
        navigate(`/crypto/${symbol}USDT`);
    };

    if (watchlistLoading || (watchlist.length > 0 && priceLoading)) {
        return (
            <div className={styles.watchlistLoading}>
                <p>Loading your watchlist...</p>
            </div>
        );
    }

    if (!watchlistLoading && watchlist.length === 0) {
        return (
            <div className={styles.watchlistEmpty}>
                <Star size={48} className={styles.watchlistEmptyIcon} />
                <h3>Your watchlist is empty</h3>
                <p>Add cryptocurrencies to your watchlist to track their prices</p>
            </div>
        );
    }

    return (
        <div className={styles.watchlistContainer}>
            <div className={styles.watchlistHeader}>
                <h2>My Watchlist</h2>
                <span className={styles.watchlistCount}>{watchlist.length} assets</span>
            </div>

            <div className={styles.watchlistTableContainer}>
                <table className={styles.watchlistTable}>
                    <thead>
                        <tr>
                            <th>Asset</th>
                            <th>Price</th>
                            <th>24h Change</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {watchlist.map((item) => {
                            const priceInfo = priceData[item.symbol] || {};
                            const isPositive = priceInfo.priceChange >= 0;

                            return (
                                <tr key={item.symbol} onClick={() => handleRowClick(item.symbol)} className={styles.watchlistRow}>
                                    <td className={styles.assetCell}>
                                        <img
                                            src={`https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/64/${item.symbol.toLowerCase()}.png`}
                                            alt={item.symbol}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '/fallback-crypto-icon.png';
                                            }}
                                        />
                                        <div className={styles.assetInfo}>
                                            <span className={styles.assetSymbol}>{item.symbol}</span>
                                        </div>
                                    </td>
                                    <td className={styles.priceCell}>
                                        ${priceInfo.price ? priceInfo.price.toFixed(2) : 'N/A'}
                                    </td>
                                    <td className={`${styles.changeCell} ${isPositive ? styles.positive : styles.negative}`}>
                                        {priceInfo.priceChange ? (
                                            <>
                                                {isPositive ? (
                                                    <ArrowUp className={styles.changeIcon} size={16} />
                                                ) : (
                                                    <ArrowDown className={styles.changeIcon} size={16} />
                                                )}
                                                {Math.abs(priceInfo.priceChange).toFixed(2)}%
                                            </>
                                        ) : 'N/A'}
                                    </td>
                                    <td className={styles.actionCell}>
                                        <button
                                            className={styles.removeButton}
                                            onClick={(e) => handleRemove(e, item.symbol)}
                                            title="Remove from watchlist"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Watchlist;