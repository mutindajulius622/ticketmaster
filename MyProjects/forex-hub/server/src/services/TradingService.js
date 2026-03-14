import User from '../models/User.js';
import Trade from '../models/Trade.js';
import { DEMO_USER, isDBConnected } from '../controllers/UserController.js';

export const processAutomatedTrading = async (prediction, currentAssets, io) => {
    let activeUsers = [];

    if (isDBConnected()) {
        activeUsers = await User.find({ isAutoTrading: true, balance: { $gt: 0 } }).lean();
    } else {
        if (DEMO_USER.isAutoTrading && DEMO_USER.balance > 0) {
            activeUsers = [DEMO_USER];
        }
    }

    if (activeUsers.length === 0) return;

    const asset = currentAssets.find(a => a.id === prediction.assetId);
    if (!asset) return;

    // Decouple logic for parallelism
    const tradingTasks = activeUsers.map(async (userData) => {
        if (prediction.confidence < 85) return;

        const isWin = Math.random() > 0.35;
        const multiplier = prediction.signal === 'BUY' ? 1 : -1;
        const profitPerLot = isWin ? (Math.random() * 45 + 15) : -(Math.random() * 30 + 10);
        let actualProfit = profitPerLot * userData.lotSize * 10;
        let adminComission = 0;

        if (actualProfit > 0 && userData.role === 'USER') {
            adminComission = actualProfit / 2;
            actualProfit = actualProfit / 2;
        }

        const statsUpdate = {
            $inc: {
                balance: actualProfit,
                totalProfit: actualProfit
            }
        };

        if (isDBConnected()) {
            // Update User and Log Trade in parallel for this specific user
            const updatePromise = User.findByIdAndUpdate(userData._id, statsUpdate, { new: true });
            const tradeLogPromise = Trade.create({
                userId: userData._id,
                asset: asset.name,
                type: prediction.signal,
                lotSize: userData.lotSize,
                entryPrice: asset.price,
                exitPrice: asset.price + (profitPerLot * 0.0001 * multiplier),
                status: 'CLOSED',
                profit: actualProfit,
                commissionShared: adminComission,
                closedAt: new Date()
            });

            const [updatedUser, trade] = await Promise.all([updatePromise, tradeLogPromise]);

            // Real-time update
            io.to(userData._id.toString()).emit('account-update', {
                balance: updatedUser.balance,
                totalProfit: updatedUser.totalProfit,
                lastTrade: trade,
                message: adminComission > 0 ? `Trade won! Profit split 50/50 with platform.` : ''
            });

            // Credit Admin if commission
            if (adminComission > 0) {
                await User.findOneAndUpdate({ role: 'ADMIN' }, {
                    $inc: { balance: adminComission, totalProfit: adminComission }
                });
            }
        } else {
            // Demo Mode
            userData.balance += actualProfit;
            userData.totalProfit += actualProfit;
            io.to(userData._id.toString()).emit('account-update', {
                balance: userData.balance,
                totalProfit: userData.totalProfit,
                message: adminComission > 0 ? `[DEMO] Trade won!` : ''
            });
        }
    });

    // Execute all trades in parallel clusters
    await Promise.all(tradingTasks);
};

