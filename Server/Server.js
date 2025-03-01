const express = require('express');
const cors = require('cors');
const connectDB = require('./Config/db');
const dotenv = require('dotenv');
const http = require('http');
const WebSocket = require('ws');
const startWebSocket = require('./binanceSocket');

dotenv.config();

const allowedOrigins = [
    'https://cryptowizz.vercel.app',
    'http://localhost:5173'
]; 
const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./Routes/authRoutes'));
app.use('/api/portfolio', require('./Routes/portfolioRoutes'));
app.use('/api/user', require('./Routes/userRoutes'));
app.use('/api/watchlist', require('./Routes/watchlistRoutes'));

connectDB();
startWebSocket(wss);

app.get('/', (req, res) => {
    res.send('Crypto API is running...');
});

const PORT = 5000;

server.listen(PORT, () => {
    console.log(`Server is listening at http://localhost:${PORT}`);
});