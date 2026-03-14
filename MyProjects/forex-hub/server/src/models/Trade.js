import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    asset: { type: String, required: true },
    type: { type: String, enum: ['BUY', 'SELL'], required: true },
    lotSize: { type: Number, required: true },
    entryPrice: { type: Number, required: true },
    exitPrice: { type: Number },
    status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
    profit: { type: Number, default: 0 },
    commissionShared: { type: Number, default: 0 },
    strategy: { type: String, default: 'AI_SMC_PATTERN' },

    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date }
});

export default mongoose.model('Trade', tradeSchema);
