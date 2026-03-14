import React, { useState } from 'react';
import { Wallet, TrendingUp, DollarSign, Settings, ArrowUpRight, ArrowDownLeft, Zap } from 'lucide-react';

import authService from '../services/authService';

const UserDashboard = ({ user, onUpdateSettings, onUserUpdate }) => {
    const [lotSize, setLotSize] = useState(user.lotSize || 0.01);
    const [isAutoTrading, setIsAutoTrading] = useState(user.isAutoTrading || false);
    const [txnModal, setTxnModal] = useState({ isOpen: false, type: 'DEPOSIT' });
    const [txnAmount, setTxnAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = () => {
        onUpdateSettings({ lotSize, isAutoTrading });
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('user')).token;
            let updatedUser;
            if (txnModal.type === 'DEPOSIT') {
                updatedUser = await authService.deposit(txnAmount, token);
            } else {
                updatedUser = await authService.withdraw(txnAmount, token);
            }
            onUserUpdate(updatedUser);
            setTxnModal({ ...txnModal, isOpen: false });
            setTxnAmount('');
        } catch (err) {
            alert(err.response?.data?.message || 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
                        <Wallet size={80} color="var(--accent-primary)" />
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>AVAILABLE BALANCE</div>
                    <div style={{ fontSize: '2.4rem', fontWeight: '800', background: 'linear-gradient(90deg, #fff, var(--accent-primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        ${user.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                        <button
                            className="btn btn-primary"
                            style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}
                            onClick={() => setTxnModal({ isOpen: true, type: 'DEPOSIT' })}
                        >
                            <ArrowDownLeft size={16} /> Deposit
                        </button>
                        <button
                            className="btn btn-secondary"
                            style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}
                            onClick={() => setTxnModal({ isOpen: true, type: 'WITHDRAW' })}
                        >
                            <ArrowUpRight size={16} /> Withdraw
                        </button>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>TOTAL PROFIT / LOSS</div>
                    <div style={{ fontSize: '2.4rem', fontWeight: '800', color: user.totalProfit >= 0 ? '#3fb950' : '#f85149' }}>
                        {user.totalProfit >= 0 ? '+' : ''}${Math.abs(user.totalProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                        <TrendingUp size={16} color="#3fb950" />
                        <span style={{ fontSize: '12px', color: '#3fb950' }}>Institutional AI Win Rate: 68.4%</span>
                    </div>
                </div>
            </div>

            {/* Trading Configuration */}
            <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <Settings size={20} color="var(--accent-primary)" />
                    <h3 style={{ fontSize: '1.2rem' }}>Institutional AI Copilot System</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Trading Lot Size (Risk Management)</label>
                        <select
                            value={lotSize}
                            onChange={(e) => setLotSize(parseFloat(e.target.value))}
                            style={{ width: '100%', padding: '14px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', color: '#fff', fontSize: '15px' }}
                        >
                            <option value={0.01}>0.01 (Micro) - $1.00/Trade Risk</option>
                            <option value={0.1}>0.10 (Mini) - $10.00/Trade Risk</option>
                            <option value={1.0}>1.00 (Standard) - $100.00/Trade Risk</option>
                            <option value={5.0}>5.00 (Institutional) - High Capital Growth</option>
                        </select>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                            Your capital is managed using Smart Money Concepts (SMC). AI will monitor institutional order blocks and execute only high-probability setups.
                        </p>
                    </div>

                    <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid', borderColor: isAutoTrading ? 'var(--accent-primary)' : 'var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ padding: '8px', borderRadius: '8px', background: isAutoTrading ? 'rgba(88, 166, 255, 0.1)' : 'rgba(255,255,255,0.05)' }}>
                                    <Zap size={20} color={isAutoTrading ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '14px' }}>INSTITUTIONAL AI</div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{isAutoTrading ? 'ACTIVE & TRADING' : 'SYSTEM IDLE'}</div>
                                </div>
                            </div>
                            <div
                                onClick={() => setIsAutoTrading(!isAutoTrading)}
                                style={{ width: '50px', height: '26px', background: isAutoTrading ? 'var(--accent-primary)' : 'var(--bg-hover)', borderRadius: '13px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                            >
                                <div style={{ position: 'absolute', top: '3px', left: isAutoTrading ? '27px' : '3px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                            </div>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                            AI Copilot uses advanced price action patterns like Liquidity Grabs and Fair Value Gaps (FVG) to ensure low-drawdown portfolio growth.
                        </p>
                    </div>
                </div>

                <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        style={{ padding: '14px 40px', fontSize: '15px', fontWeight: '700', borderRadius: '12px', boxShadow: '0 4px 15px rgba(88, 166, 255, 0.2)' }}
                    >
                        Save Configuration
                    </button>
                </div>
            </div>

            {/* Transaction Modal */}
            {txnModal.isOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', padding: '32px' }}>
                        <h3 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>{txnModal.type === 'DEPOSIT' ? 'Add Funds' : 'Withdraw Profits'}</h3>
                        <form onSubmit={handleTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Amount (USD)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={txnAmount}
                                    onChange={(e) => setTxnAmount(e.target.value)}
                                    placeholder="0.00"
                                    style={{ width: '100%', padding: '16px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', color: '#fff', fontSize: '1.2rem', fontWeight: '600' }}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '16px', fontSize: '16px', fontWeight: '700' }}>
                                {loading ? 'Processing...' : `Confirm ${txnModal.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}`}
                            </button>
                            <button type="button" onClick={() => setTxnModal({ ...txnModal, isOpen: false })} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDashboard;
