import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import PriceChart from '../Chart/PriceChart';
import styles from './CryptoDetail.module.css';
import TradingForm from '../TradingForm/TradingForm';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, Star, StarOff } from 'lucide-react';
import { useWatchlist } from '../../Services/Watchlist';

const TimeFrames = {
  MIN_15: '15m',
  MIN_30: '30m',
  HOUR_1: '1h',
  HOUR_4: '4h',
  DAY_1: '1d',
  WEEK_1: '1w',
  MONTH_1: '1M',
  MONTH_3: '3M',
  YEAR_1: '1Y',
  ALL: 'ALL'
};

const formatPrice = (price) => {
  if (price === 0) return '0';
  const decimalPlaces = price >= 1 ? 2 : Math.min(8, Math.abs(Math.floor(Math.log10(price))) + 2);
  return price.toFixed(decimalPlaces);
};

const CryptoDetail = () => {
  const { symbol } = useParams();
  const baseSymbol = symbol.replace('USDT', '');
  const [cryptoData, setCryptoData] = useState({
    price: 0,
    percentageChange: 0,
    high: 0,
    low: 0,
    volume: 0
  });
  const [priceHistory, setPriceHistory] = useState([]);
  const [timeframe, setTimeframe] = useState(TimeFrames.HOUR_1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const WS_API_KEY = import.meta.env.VITE_WS_API;

  const fetchInitialData = useCallback(async () => {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      if (!response.ok) throw new Error('Failed to fetch initial data');
      const data = await response.json();

      setCryptoData({
        price: parseFloat(data.lastPrice),
        percentageChange: parseFloat(data.priceChangePercent),
        high: parseFloat(data.highPrice),
        low: parseFloat(data.lowPrice),
        volume: parseFloat(data.volume)
      });
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  }, [symbol]);

  const fetchHistoricalData = useCallback(async () => {
    try {
      setLoading(true);
      let interval;
      let limit;

      switch (timeframe) {
        case '15m': interval = '15m'; limit = 96; break;
        case '30m': interval = '30m'; limit = 96; break;
        case '1h': interval = '1h'; limit = 96; break;
        case '4h': interval = '4h'; limit = 96; break;
        case '1d': interval = '1d'; limit = 30; break;
        case '1w': interval = '1w'; limit = 52; break;
        case '1M': interval = '1M'; limit = 12; break;
        default: interval = '1h'; limit = 96;
      }

      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );

      if (!response.ok) throw new Error('Failed to fetch historical data');

      const data = await response.json();
      const formattedData = data.map(d => ({
        date: d[0],
        price: parseFloat(d[4]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        volume: parseFloat(d[5])
      }));

      setPriceHistory(formattedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setError(error.message);
      setLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    let ws = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connectWebSocket = () => {
      if (reconnectAttempts >= maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        return;
      }

      ws = new WebSocket(WS_API_KEY);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        reconnectAttempts = 0;
        ws.send(JSON.stringify({ type: 'subscribe', symbol }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'price_update' && data.symbol === symbol) {
            setCryptoData({
              price: data.price,
              percentageChange: data.percentageChange,
              high: data.high,
              low: data.low,
              volume: data.volume
            });

            if (['15m', '30m', '1h'].includes(timeframe)) {
              setPriceHistory(prev => {
                const newPrice = {
                  date: new Date().getTime(),
                  price: data.price,
                  high: data.high,
                  low: data.low,
                  volume: data.volume
                };
                return [...prev.slice(1), newPrice];
              });
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        reconnectAttempts++;
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    fetchInitialData();
    fetchHistoricalData();
    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [symbol, timeframe, fetchHistoricalData, fetchInitialData]);

  const handleWatchlistClick = async () => {
    const isInWatchlist = Array.isArray(watchlist) && watchlist.some(item => item.symbol === baseSymbol);
    if (isInWatchlist) {
      await removeFromWatchlist(baseSymbol);
    } else {
      await addToWatchlist(baseSymbol);
    }
  };

  const isInWatchlist = () => {
    return Array.isArray(watchlist) && watchlist.some(item => item.symbol === baseSymbol);
  };

  if (loading && !cryptoData.price) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.cryptoDetailContainer}>
      <div className={styles.cryptoHeader}>
        <div className={styles.titleAndWatchlist}>
          <h2 className={styles.cryptoTitle}>{baseSymbol}</h2>
          <button className={styles.watchlistButton} onClick={handleWatchlistClick}
            title={isInWatchlist() ? "Remove from watchlist" : "Add to watchlist"}>
            {isInWatchlist() ? (
              <Star className={styles.starIcon} />
            ) : (
              <StarOff className={styles.starIcon} />
            )}
          </button>
        </div>
        <div className={styles.cryptoPriceContainer}>
          <span className={styles.cryptoPrice}>
            ${formatPrice(cryptoData.price)}
          </span>
          <span className={`${styles.priceChange} ${cryptoData.percentageChange >= 0 ? styles.textGreen : styles.textRed}`}>
            {cryptoData.percentageChange.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className={styles.timeframeButtons}>
        {Object.entries(TimeFrames).map(([key, value]) => (
          <button key={key} onClick={() => setTimeframe(value)}
            className={`${styles.timeframeButton} ${timeframe === value ? styles.active : ''}`}>
            {value}
          </button>
        ))}
      </div>

      <PriceChart className={styles.chartContainer} priceHistory={priceHistory} timeframe={timeframe} symbol={symbol} />

      <div className={styles.bottomContainer}>
        <div className={styles.statisticsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>High</span>
            <p className={styles.statValue}>${formatPrice(cryptoData.high)}</p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Low</span>
            <p className={styles.statValue}>${formatPrice(cryptoData.low)}</p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>24h Change</span>
            <p className={`${styles.statValue} ${cryptoData.percentageChange >= 0 ? styles.textGreen : styles.textRed}`}>
              {cryptoData.percentageChange.toFixed(2)}%
            </p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Volume</span>
            <p className={styles.statValue}>${cryptoData.volume.toLocaleString()}</p>
          </div>
        </div>

        <div className={styles.tradingFormContainer}>
          <TradingForm symbol={symbol} currentPrice={cryptoData.price} />
        </div>
      </div>
      <Link to="/portfolio" className={styles.portfolioLink}>Go to Portfolio<ArrowRightIcon /></Link>
    </div>
  );
};

export default CryptoDetail;