import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, TrendingUp, TrendingDown, Clock, BarChart4, PieChart, Activity, Globe, Info } from 'lucide-react';
import TradingChart from './TradingChart';

const MarketsView = ({ assets }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(assets[0]);
    const [filter, setFilter] = useState('ALL');

    const filteredAssets = assets.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (filter === 'ALL') return matchesSearch;
        if (filter === 'CRYPTO') return matchesSearch && a.name.includes('/');
        if (filter === 'FOREX') return matchesSearch && !a.name.includes('/');
        return matchesSearch;
    });

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
                <div>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '8px' }}>Global <span style={{ color: 'var(--accent-primary)' }}>Markets</span></h2>
                    <p style={{ color: 'var(--text-muted)' }}>Institutional multi-asset trading floor with real-time liquidity depth.</p>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: '48px', gap: '12px' }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            placeholder="Search asset..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '200px' }}
                        />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.2fr) 2fr', gap: '24px', height: 'calc(100vh - 250px)' }}>
                {/* Asset List Side */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
                        {['ALL', 'FOREX', 'CRYPTO', 'COM'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    background: filter === f ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                                    color: filter === f ? '#000' : 'var(--text-muted)',
                                    border: 'none',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    cursor: 'pointer'
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {filteredAssets.map(asset => {
                            const isUp = Math.random() > 0.4;
                            const change = (Math.random() * 0.8).toFixed(2);
                            return (
                                <div
                                    key={asset.id}
                                    onClick={() => setSelectedAsset(asset)}
                                    style={{
                                        padding: '20px',
                                        borderBottom: '1px solid var(--border-color)',
                                        cursor: 'pointer',
                                        background: selectedAsset?.id === asset.id ? 'rgba(56, 189, 248, 0.05)' : 'transparent',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', color: 'var(--accent-primary)' }}>
                                            {asset.name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '15px' }}>{asset.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mkt Cap: $4.2B</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '800', fontSize: '15px' }}>{asset.price}</div>
                                        <div style={{ fontSize: '12px', color: isUp ? 'var(--accent-secondary)' : 'var(--accent-danger)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                            <TrendingUp size={12} /> {isUp ? '+' : '-'}{change}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Detail Side */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {selectedAsset && (
                        <>
                            <TradingChart assetName={selectedAsset.name} />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div className="glass-panel" style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                        <Activity size={18} color="var(--accent-primary)" />
                                        <h4 style={{ fontSize: '1rem' }}>Technical Analysis</h4>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Volatility (ATR)</span>
                                            <span style={{ fontWeight: '700' }}>0.0084</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Average Spread</span>
                                            <span style={{ fontWeight: '700' }}>0.2 Pips</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Institutional Bias</span>
                                            <span style={{ fontWeight: '700', color: 'var(--accent-secondary)' }}>STRONG BUY</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-panel" style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                        <Globe size={18} color="var(--accent-secondary)" />
                                        <h4 style={{ fontSize: '1rem' }}>Market Sentiment</h4>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                                            <span>Retail: 62% Short</span>
                                            <span>Smart Money: 78% Long</span>
                                        </div>
                                        <div style={{ height: '12px', background: 'var(--accent-danger)', borderRadius: '6px', position: 'relative', overflow: 'hidden' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '78%' }}
                                                style={{ height: '100%', background: 'var(--accent-secondary)', position: 'absolute', right: 0 }}
                                            />
                                        </div>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                            Institutional volume is heavily building on the bid side. Potential liquidity sweep expected soon.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarketsView;
