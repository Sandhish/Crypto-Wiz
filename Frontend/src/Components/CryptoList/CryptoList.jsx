import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowUpIcon, ArrowDownIcon, SearchIcon, CircleUserRound, Star, StarOff } from 'lucide-react';
import { useWatchlist } from '../../Services/Watchlist';
import axios from 'axios';
import classNames from 'classnames';
import styles from './CryptoList.module.css';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../SideBar/SideBar';

const CryptoList = () => {
  const navigate = useNavigate();
  const savedPage = parseInt(sessionStorage.getItem('cryptoListPage')) || 1;
  const ws = useRef(null);

  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [page, setPage] = useState(savedPage);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);
  const [totalCoins, setTotalCoins] = useState(0);
  const [websocketConnected, setWebsocketConnected] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { watchlist = [], addToWatchlist, removeFromWatchlist } = useWatchlist();

  const ITEMS_PER_PAGE = 30;
  const API_KEY = import.meta.env.VITE_API_KEY;
  const WS_URL = import.meta.env.VITE_WS_API;

  const cryptosRef = useRef(cryptos);
  useEffect(() => {
    cryptosRef.current = cryptos;
  }, [cryptos]);

  const connectWebSocket = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      setWebsocketConnected(true);

      cryptosRef.current.forEach(crypto => {
        ws.current.send(JSON.stringify({
          type: 'subscribe',
          symbol: `${crypto.symbol}USDT`
        }));
      });
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'price_update') {
        setCryptos(prevCryptos =>
          prevCryptos.map(crypto =>
            crypto.symbol === data.symbol.replace('USDT', '')
              ? {
                ...crypto,
                price: data.price,
                percentageChange: data.percentageChange,
                volume: data.volume
              }
              : crypto
          )
        );
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setWebsocketConnected(false);
      setTimeout(connectWebSocket, 5000);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
      ws.current?.close();
    };
  }, []);

  const fetchCryptos = async () => {
    const isInitialLoad = cryptos.length === 0;
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setPageLoading(true);
    }
    setError(null);

    try {
      if (totalCoins === 0) {
        const overviewResponse = await axios.post('https://api.livecoinwatch.com/coins/list', {
          currency: 'USD',
          sort: 'rank',
          order: 'ascending',
          offset: 0,
          limit: 1,
          meta: true
        }, {
          headers: {
            'content-type': 'application/json',
            'x-api-key': API_KEY
          }
        });
        setTotalCoins(overviewResponse.headers['x-total-count'] || 5000);
      }

      const offset = (page - 1) * ITEMS_PER_PAGE;
      const response = await axios.post('https://api.livecoinwatch.com/coins/list', {
        currency: 'USD',
        sort: 'rank',
        order: 'ascending',
        offset: offset,
        limit: ITEMS_PER_PAGE,
        meta: true
      }, {
        headers: {
          'content-type': 'application/json',
          'x-api-key': API_KEY
        }
      });

      const formattedData = response.data.map((crypto) => ({
        id: crypto.code,
        symbol: crypto.code.replace(/_/g, ''),
        name: crypto.name,
        price: crypto.rate,
        percentageChange: crypto.delta.day,
        marketCap: crypto.cap,
        volume: crypto.volume,
        iconUrl: `https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/64/${crypto.code.toLowerCase()}.png`,
        rank: crypto.rank || Infinity
      }));

      formattedData.sort((a, b) => a.rank - b.rank);
      setCryptos(formattedData);

      if (websocketConnected && ws.current?.readyState === WebSocket.OPEN) {
        formattedData.forEach(crypto => {
          ws.current.send(JSON.stringify({
            type: 'subscribe',
            symbol: `${crypto.symbol}USDT`
          }));
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('An error occurred while fetching data. Please try again later.');
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const cleanQuery = query.trim().toLowerCase();

    const localResults = cryptos.filter(crypto =>
      crypto.name.toLowerCase().includes(cleanQuery) ||
      crypto.symbol.toLowerCase().includes(cleanQuery)
    ).map(crypto => ({
      ...crypto,
      matchScore: (
        crypto.symbol.toLowerCase() === cleanQuery ? 3 :
          crypto.symbol.toLowerCase().startsWith(cleanQuery) ? 2 :
            crypto.name.toLowerCase().startsWith(cleanQuery) ? 1 : 0
      )
    }));

    if (cleanQuery.length < 2) {
      setSearchResults(localResults
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10)
      );
      return;
    }

    try {
      const response = await axios.post('https://api.livecoinwatch.com/coins/list', {
        currency: 'USD',
        sort: 'rank',
        order: 'ascending',
        offset: 0,
        limit: 20,
        meta: true,
        search: cleanQuery
      }, {
        headers: {
          'content-type': 'application/json',
          'x-api-key': API_KEY
        }
      });

      const apiResults = response.data.map(crypto => ({
        id: crypto.code,
        symbol: crypto.code.replace(/_/g, ''),
        name: crypto.name,
        price: crypto.rate,
        percentageChange: crypto.delta.day,
        marketCap: crypto.cap,
        volume: crypto.volume,
        iconUrl: `https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/64/${crypto.code.toLowerCase()}.png`,
        matchScore: (
          crypto.code.toLowerCase() === cleanQuery ? 3 :
            crypto.code.toLowerCase().startsWith(cleanQuery) ? 2 :
              crypto.name.toLowerCase().startsWith(cleanQuery) ? 1 : 0
        )
      }));

      const combinedResults = [...apiResults];
      localResults.forEach(localResult => {
        if (!combinedResults.some(r => r.symbol === localResult.symbol)) {
          combinedResults.push(localResult);
        }
      });

      const sortedResults = combinedResults
        .sort((a, b) => {
          if (b.matchScore !== a.matchScore) {
            return b.matchScore - a.matchScore;
          }
          return (b.marketCap || 0) - (a.marketCap || 0);
        })
        .slice(0, 10);

      setSearchResults(sortedResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults(
        localResults
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 10)
      );
    }
  }, [cryptos, API_KEY]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  useEffect(() => {
    return () => {
      setSearchResults([]);
      setSearchQuery('');
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(`.${styles.searchBarContainer}`)) {
        setSearchResults([]);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (page !== 1) {
      sessionStorage.setItem('cryptoListPage', page.toString());
    }
  }, [page]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connectWebSocket]);

  useEffect(() => {
    fetchCryptos();
  }, [page]);

  const handleRowClick = (symbol) => {
    const cleanSymbol = symbol.replace(/_/g, '');
    navigate(`/crypto/${cleanSymbol}USDT`);
  };

  const handleNextPage = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage((prevPage) => prevPage - 1);
    }
  };

  const handleWatchlistClick = async (e, symbol) => {
    e.stopPropagation();
    const isInWatchlist = Array.isArray(watchlist) && watchlist.some(item => item.symbol === symbol);
    if (isInWatchlist) {
      await removeFromWatchlist(symbol);
    } else {
      await addToWatchlist(symbol);
    }
  };

  const isInWatchlist = (symbol) => {
    return Array.isArray(watchlist) && watchlist.some(item => item.symbol === symbol);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        Loading cryptocurrencies...
      </div>
    );
  }

  const totalPages = Math.ceil(totalCoins / ITEMS_PER_PAGE);

  return (
    <div className={styles.cryptoListContainer}>
      {error && (
        <div className={styles.errorDialog}>
          <div className={styles.errorContent}>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Refresh</button>
          </div>
        </div>
      )}

      {!error && (
        <>
          <div className={styles.headerContainer}>
            <h2 className={styles.cryptoListHeading}><i>Crypto Wiz</i></h2>
            <div className={styles.searchBarWrapper}>
              <div className={styles.searchBarContainer}>
                <input type="text" placeholder="Search by name or symbol..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} className={styles.searchBar}
                  onFocus={() => {
                    if (searchQuery) {
                      handleSearch(searchQuery);
                    }
                  }}
                />
                <SearchIcon className={styles.searchIcon} size={20} />
                {searchResults.length > 0 && searchQuery && (
                  <div className={styles.searchResults}>
                    {searchResults.map((crypto) => (
                      <div key={crypto.id} className={styles.searchResultItem}
                        onClick={() => {
                          handleRowClick(crypto.symbol);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                      >
                        <img src={crypto.iconUrl} alt={crypto.symbol} className={styles.searchResultIcon}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/fallback-crypto-icon.png';
                          }}
                        />
                        <span>
                          {crypto.name} ({crypto.symbol})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.iconContainer} title='Account'>
                <CircleUserRound size={38} className={styles.profileIcon} onClick={() => setIsSidebarOpen(true)} />
              </div>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.cryptoListTable}>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Price</th>
                  <th>24h Change</th>
                  <th>Market Cap</th>
                  <th>Volume (24h)</th>
                </tr>
              </thead>
              <tbody>
                {cryptos.map((crypto) => (
                  <tr key={`${crypto.symbol}-${crypto.id}`} className={styles.cryptoRow} onClick={() => handleRowClick(crypto.symbol)} >
                    <td className={styles.assetCell}>
                      <button className={styles.watchlistButton} onClick={(e) => handleWatchlistClick(e, crypto.symbol)} >
                        {isInWatchlist(crypto.symbol) ? (
                          <Star className={styles.starIcon} />
                        ) : (
                          <StarOff className={styles.starIcon} />
                        )}
                      </button>
                      <img src={crypto.iconUrl} alt={crypto.symbol} className={styles.cryptoIcon} />
                      <span className={styles.cryptoName}>{crypto.name}</span>
                      <span className={styles.cryptoSymbol}>{crypto.symbol}</span>
                    </td>
                    <td className={styles.priceCell}>
                      ${crypto.price.toFixed(2)}
                    </td>
                    <td className={classNames(styles.changeCell, {
                      [styles.positive]: crypto.percentageChange > 0,
                      [styles.negative]: crypto.percentageChange < 0,
                    })}>
                      {crypto.percentageChange > 0 ? (
                        <ArrowUpIcon className={styles.arrowIcon} />
                      ) : (
                        <ArrowDownIcon className={styles.arrowIcon} />
                      )}
                      {Math.abs(crypto.percentageChange).toFixed(2)}%
                    </td>
                    <td className={styles.marketCapCell}>
                      ${crypto.marketCap ? (crypto.marketCap / 1e9).toFixed(2) + 'B' : 'N/A'}
                    </td>
                    <td className={styles.volumeCell}>
                      ${crypto.volume ? (crypto.volume / 1e6).toFixed(2) + 'M' : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.pagination}>
            <button className={styles.pageButton} onClick={handlePreviousPage} disabled={page === 1 || loading} >
              Previous
            </button>
            <span className={styles.pageInfo}>
              Page {page} of {totalPages}
            </span>
            <button className={styles.pageButton} onClick={handleNextPage} disabled={page === totalPages || loading} >
              Next
            </button>
          </div>
        </>
      )}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}
      />
    </div>
  );
};

export default CryptoList;