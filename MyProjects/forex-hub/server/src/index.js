import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cluster from 'cluster';
import os from 'os';

import UserRoutes from './routes/UserRoutes.js';
import { processAutomatedTrading } from './services/TradingService.js';

dotenv.config();

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died. Forking a new one...`);
        cluster.fork();
    });
} else {
    const app = express();
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        },
        transports: ['websocket'], // Force websocket for high-performance scale
        allowEIO3: true
    });

    // High Performance Middlewares
    app.use(helmet()); // Security headers
    app.use(compression()); // Gzip compression
    app.use(express.json({ limit: '10kb' })); // Body limit
    app.use(cors());

    // Rate Limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100, // Limit each IP to 100 requests per window
        message: 'Too many requests from this IP, please try again after 15 minutes'
    });
    app.use('/api/', limiter);

    // Routes
    app.use('/api/users', UserRoutes);

    const PORT = process.env.PORT || 3001;

    // Market Simulation Data (Shared via IO in cluster normally requires Redis, 
    // but here we let each worker maintain its own simulation for demo scale)
    let assets = [
        { id: 'eur-usd', name: 'EUR/USD', price: 1.0845, trend: 0 },
        { id: 'gbp-usd', name: 'GBP/USD', price: 1.2672, trend: 0 },
        { id: 'usd-jpy', name: 'USD/JPY', price: 149.32, trend: 0 },
        { id: 'btc-usd', name: 'BTC/USD', price: 62450.00, trend: 0 },
        { id: 'xau-usd', name: 'XAU/USD (Gold)', price: 2165.40, trend: 0 },
    ];

    const generatePrediction = (asset) => {
        const confidence = Math.floor(Math.random() * 35) + 65;
        const signal = Math.random() > 0.5 ? 'BUY' : 'SELL';
        const reasons = signal === 'BUY' ? [
            'SMC Pattern: Institutional Order Block detected at H4 support zone.',
            'Fair Value Gap (FVG) being filled with strong bullish displacement.',
            'Liquidity Grab below previous daily low completed; reversal imminent.',
            'RSI oversold with bullish divergence on the 1-hour timeframe.'
        ] : [
            'SMC Pattern: Bearish Breaker structure confirmed on M15 chart.',
            'Market reached premium pricing zone with Fair Value Gap resistance.',
            'Liquidity sweep of previous week high; smart money entering short.',
            'Institutional sell-side imbalance detected via order flow analysis.'
        ];

        return {
            assetId: asset.id,
            signal,
            confidence,
            reason: reasons[Math.floor(Math.random() * reasons.length)],
            timestamp: new Date().toISOString()
        };
    };

    // Update prices every 1 second
    setInterval(() => {
        assets.forEach(asset => {
            const change = (Math.random() - 0.5) * (asset.price * 0.0001);
            asset.price = parseFloat((asset.price + change).toFixed(
                (asset.id.includes('jpy') || asset.id.includes('xau')) ? 2 : 5
            ));
        });
        io.emit('market-update', assets);
    }, 1000);

    // Prediction interval + Automated Trading Execution
    setInterval(async () => {
        const randomAsset = assets[Math.floor(Math.random() * assets.length)];
        const prediction = generatePrediction(randomAsset);
        io.emit('new-prediction', prediction);

        try {
            await processAutomatedTrading(prediction, assets, io);
        } catch (error) {
            console.error('Auto-trading error:', error);
        }
    }, 5000);

    io.on('connection', (socket) => {
        socket.on('join', (userId) => {
            socket.join(userId);
        });
        socket.emit('market-update', assets);
    });

    const connectDB = async () => {
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 5000,
            });
            console.log(`Worker ${process.pid} connected to MongoDB`);
        } catch (err) {
            console.log(`Worker ${process.pid} running in DEMO MODE`);
        }
    };

    connectDB();

    httpServer.listen(PORT, () => {
        console.log(`Worker ${process.pid} started on port ${PORT}`);
    });
}

