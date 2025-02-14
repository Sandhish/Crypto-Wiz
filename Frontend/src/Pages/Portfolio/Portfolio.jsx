import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CircleFadingPlus } from 'lucide-react';
import styles from './Portfolio.module.css';

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('holdings');
  const [priceUpdates, setPriceUpdates] = useState({});
  const ws = useRef(null);

  const BACKEND_API_KEY = import.meta.env.VITE_BACKEND_API;
  const WS_API_KEY = import.meta.env.VITE_WS_API;

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        const [portfolioRes, historyRes] = await Promise.all([
          fetch(`${BACKEND_API_KEY}/api/portfolio/portfolio`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          fetch(`${BACKEND_API_KEY}/api/portfolio/history`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
        ]);

        const portfolioData = await portfolioRes.json();
        const historyData = await historyRes.json();

        setPortfolio(portfolioData.portfolio);
        setBalance(portfolioData.balance);
        setTransactions(historyData);
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, []);

  useEffect(() => {
    ws.current = new WebSocket(WS_API_KEY);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      portfolio.forEach((holding) => {
        if (ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(
            JSON.stringify({
              type: 'subscribe',
              symbol: holding.stockSymbol,
            })
          );
        }
      });
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'price_update') {
        setPriceUpdates((prev) => ({
          ...prev,
          [data.symbol]: {
            currentPrice: data.price,
            percentageChange: data.percentageChange,
          },
        }));
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected');
    };

    return () => {
      if (ws.current) {
        portfolio.forEach((holding) => {
          if (ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(
              JSON.stringify({
                type: 'unsubscribe',
                symbol: holding.stockSymbol,
              })
            );
          }
        });
        ws.current.close();
      }
    };
  }, [portfolio]);

  const getHoldingInitialPrice = (symbol) => {
    const firstBuyTx = transactions
      .filter((tx) => tx.symbol === symbol && tx.type === 'BUY')
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0];

    return firstBuyTx ? firstBuyTx.price : 0;
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.portfolioContainer}>
      <div className={styles.header}>
        <h1>Portfolio</h1>
        <div className={styles.balance}>
          <div className={styles.balanceContainer}>
            <span>Available Balance</span>
            <Link to="/funds" className={styles.balanceLink}>
              <CircleFadingPlus size={24} className={styles.plusIcon} />
            </Link>
          </div>
          <h2>${balance.toLocaleString()}</h2>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'holdings' ? styles.active : ''}`} onClick={() => setActiveTab('holdings')} >
          Holdings
        </button>
        <button className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`} onClick={() => setActiveTab('history')} >
          Transaction History
        </button>
      </div>

      {activeTab === 'holdings' ? (
        <div className={styles.holdings}>
          {portfolio.length === 0 ? (
            <p className={styles.noData}>No holdings to display</p>
          ) : (
            portfolio.map((holding) => {
              const priceUpdate = priceUpdates[holding.stockSymbol] || {};
              const initialPrice = getHoldingInitialPrice(holding.stockSymbol);
              const currentPrice = priceUpdate.currentPrice || initialPrice;
              const totalValue = currentPrice * holding.quantity;
              const percentageChange =
                ((currentPrice - initialPrice) / initialPrice) * 100;

              return (
                <Link to={`/crypto/${holding.stockSymbol}`} key={holding.stockSymbol} className={styles.holdingCard} >
                  <div className={styles.holdingInfo}>
                    <h3>{holding.stockSymbol}</h3>
                    <div className={styles.holdingDetails}>
                      <p>{holding.quantity} units</p>
                      <p className={styles.holdingValue}>
                        $
                        {totalValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p
                        className={`${styles.percentChange} ${percentageChange >= 0
                          ? styles.positive
                          : styles.negative
                          }`}
                      >
                        {percentageChange >= 0 ? '+' : ''}
                        {percentageChange.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      ) : (
        <div className={styles.transactions}>
          {transactions.length === 0 ? (
            <p className={styles.noData}>No transactions to display</p>
          ) : (
            transactions.map((tx) => (
              <div key={tx._id} className={styles.transaction}>
                <div className={styles.txInfo}>
                  <span className={`${styles.txType} ${styles[tx.type.toLowerCase()]}`} >
                    {tx.type}
                  </span>
                  <span className={styles.txSymbol}>{tx.symbol}</span>
                </div>
                <div className={styles.txDetails}>
                  <p>Quantity: {tx.quantity}</p>
                  <p>Price: ${tx.price.toFixed(2)}</p>
                  <p>Total: ${tx.total.toFixed(2)}</p>
                  <p className={styles.txDate}>
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Portfolio;
