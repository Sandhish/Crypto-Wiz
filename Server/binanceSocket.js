const WebSocket = require('ws');

class BinanceWebSocketManager {
  constructor() {
    this.BINANCE_WS_URL = 'wss://stream.binance.com:9443/stream?streams=';
    this.clients = new Map();
    this.binanceWs = null;
    this.activeStreams = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.isReconnecting = false;
  }

  async updateBinanceConnection() {
    if (this.isReconnecting) {
      return;
    }

    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      if (this.binanceWs) {
        this.binanceWs.terminate();
        this.binanceWs = null;
      }

      const streams = Array.from(this.activeStreams).join('/');
      if (!streams) {
        return;
      }

      this.isReconnecting = true;
      const wsUrl = `${this.BINANCE_WS_URL}${streams}`;
      this.binanceWs = new WebSocket(wsUrl);

      this.binanceWs.on('open', () => {
        console.log('Connected to Binance WebSocket');
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
      });

      this.binanceWs.on('message', (data) => {
        this.handleMessage(data);
      });

      this.binanceWs.on('error', (error) => {
        console.error('Binance WebSocket error:', error);
        this.handleReconnect();
      });

      this.binanceWs.on('close', () => {
        console.log('Binance WebSocket closed');
        this.handleReconnect();
      });

    } catch (error) {
      console.error('Error in updateBinanceConnection:', error);
      this.handleReconnect();
    }
  }

  handleMessage(data) {
    try {
      const parsedData = JSON.parse(data);
      const {
        s: symbol,
        c: price,
        P: priceChangePercent,
        h: high24h,
        l: low24h,
        v: volume,
        p: priceChange
      } = parsedData.data;

      this.clients.forEach((subscriptions, client) => {
        if (client.readyState === WebSocket.OPEN && subscriptions.has(symbol)) {
          client.send(JSON.stringify({
            type: 'price_update',
            symbol,
            price: parseFloat(price),
            percentageChange: parseFloat(priceChangePercent),
            high: parseFloat(high24h),
            low: parseFloat(low24h),
            volume: parseFloat(volume),
            priceChange: parseFloat(priceChange)
          }));
        }
      });
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }

  handleReconnect() {
    if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnection attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}`);

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

    this.reconnectTimeout = setTimeout(() => {
      this.isReconnecting = false;
      this.updateBinanceConnection();
    }, delay);
  }

  cleanup() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.binanceWs) {
      this.binanceWs.terminate();
    }
    this.clients.clear();
    this.activeStreams.clear();
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
  }
}

const startWebSocket = (wss) => {
  const manager = new BinanceWebSocketManager();

  wss.on('connection', (ws) => {
    manager.clients.set(ws, new Set());
    console.log('Client connected');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'subscribe' && typeof data.symbol === 'string') {
          const subscriptions = manager.clients.get(ws);
          subscriptions.add(data.symbol);
          manager.activeStreams.add(`${data.symbol.toLowerCase()}@ticker`);
          manager.updateBinanceConnection();
          console.log(`Client subscribed to ${data.symbol}`);
        }

        if (data.type === 'unsubscribe' && typeof data.symbol === 'string') {
          const subscriptions = manager.clients.get(ws);
          subscriptions.delete(data.symbol);
          manager.activeStreams.delete(`${data.symbol.toLowerCase()}@ticker`);
          manager.updateBinanceConnection();
          console.log(`Client unsubscribed from ${data.symbol}`);
        }
      } catch (error) {
        console.error('Error processing client message:', error);
      }
    });

    ws.on('close', () => {
      const subscriptions = manager.clients.get(ws);
      if (subscriptions) {
        subscriptions.forEach((symbol) => {
          if (typeof symbol === 'string') {
            manager.activeStreams.delete(`${symbol.toLowerCase()}@ticker`);
          }
        });
        manager.clients.delete(ws);
        manager.updateBinanceConnection();
      }
      console.log('Client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket client error:', error);
      manager.clients.delete(ws);
    });
  });

  process.on('SIGINT', () => {
    manager.cleanup();
    wss.clients.forEach((client) => client.close());
    process.exit(0);
  });

  return manager;
};

module.exports = startWebSocket;