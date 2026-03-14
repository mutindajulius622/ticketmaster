import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Globe, Zap, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export const EconomicCalendar = () => {
    const events = [
        { time: '14:30', currency: 'USD', impact: 'High', event: 'Non-Farm Payrolls (NFP)', forecast: '185K', actual: '223K' },
        { time: '15:15', currency: 'EUR', impact: 'Medium', event: 'ECB Press Conference', forecast: '-', actual: '-' },
        { time: '16:00', currency: 'GBP', impact: 'High', event: 'BoE Interest Rate Decision', forecast: '5.25%', actual: '5.25%' },
        { time: '20:00', currency: 'USD', impact: 'Low', event: 'Consumer Credit', forecast: '15.2B', actual: '-' },
    ];

    return (
        <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Calendar size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1rem' }}>Economic Calendar</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {events.map((e, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{e.time}</span>
                            <span style={{ fontWeight: '700', fontSize: '13px' }}>{e.currency}</span>
                            <span style={{ fontSize: '13px' }}>{e.event}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <span style={{ fontSize: '11px', color: e.impact === 'High' ? '#f85149' : e.impact === 'Medium' ? '#d2a8ff' : 'var(--text-muted)', fontWeight: '700' }}>
                                {e.impact.toUpperCase()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const MarketHeatmap = ({ assets }) => {
    return (
        <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Globe size={18} color="var(--accent-secondary)" />
                <h3 style={{ fontSize: '1rem' }}>Global Market Heatmap</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                {assets.map((asset, i) => {
                    const isUp = Math.random() > 0.4;
                    const change = (Math.random() * 0.5).toFixed(2);
                    return (
                        <motion.div
                            key={i}
                            whileHover={{ scale: 1.05 }}
                            style={{
                                padding: '16px',
                                borderRadius: '12px',
                                background: isUp ? 'rgba(63, 185, 80, 0.1)' : 'rgba(248, 81, 73, 0.1)',
                                border: '1px solid',
                                borderColor: isUp ? '#3fb95044' : '#f8514944',
                                textAlign: 'center'
                            }}
                        >
                            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>{asset.name.split('/')[0]}</div>
                            <div style={{ fontSize: '12px', color: isUp ? '#3fb950' : '#f85149', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                {isUp ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                {isUp ? '+' : '-'}{change}%
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
