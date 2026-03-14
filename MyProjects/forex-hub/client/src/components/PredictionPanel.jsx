import React from 'react';
import { TrendingUp, TrendingDown, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PredictionPanel = React.memo(({ predictions }) => {
    return (
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={20} color="#58a6ff" />
                <h3 style={{ fontSize: '1.1rem' }}>AI Predictions</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '400px', paddingRight: '4px' }}>
                <AnimatePresence initial={false}>
                    {predictions.length === 0 ? (
                        <div style={{ color: '#8b949e', textAlign: 'center', padding: '20px' }}>
                            Waiting for market analysis...
                        </div>
                    ) : (
                        predictions.map((p, idx) => (
                            <motion.div
                                key={`${p.timestamp}-${idx}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    padding: '12px',
                                    borderRadius: '10px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: '700', color: '#fff' }}>{p.assetId?.toUpperCase()}</span>
                                    <span style={{
                                        fontSize: '12px',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: p.signal === 'BUY' ? 'rgba(63, 185, 80, 0.2)' : 'rgba(248, 81, 73, 0.2)',
                                        color: p.signal === 'BUY' ? '#3fb950' : '#f85149'
                                    }}>
                                        {p.signal}
                                    </span>
                                </div>

                                <p style={{ fontSize: '13px', color: '#8b949e', marginBottom: '10px', lineHeight: '1.4' }}>
                                    {p.reason}
                                </p>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#58a6ff' }}>
                                        <ShieldCheck size={14} />
                                        <span>{p.confidence}% Confidence</span>
                                    </div>
                                    <span style={{ color: '#58a6ff', opacity: 0.5 }}>•</span>
                                    <span style={{ color: '#8b949e' }}>{new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                </div>

                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    height: '2px',
                                    background: p.signal === 'BUY' ? '#3fb950' : '#f85149',
                                    width: `${p.confidence}%`
                                }} />
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
});


export default PredictionPanel;
