import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';

const TradingChart = React.memo(({ assetName }) => {
    const chartContainerRef = useRef();
    const chartRef = useRef();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const timer = setTimeout(() => {
            if (!chartContainerRef.current) return;

            try {
                const chart = createChart(chartContainerRef.current, {
                    layout: {
                        background: { color: '#0a0c10' },
                        textColor: '#8b949e',
                    },
                    grid: {
                        vertLines: { color: 'rgba(48, 54, 61, 0.3)' },
                        horzLines: { color: 'rgba(48, 54, 61, 0.3)' },
                    },
                    width: chartContainerRef.current.clientWidth || 800,
                    height: 400,
                });

                // Modern API check
                let candleSeries;
                if (chart.addCandlestickSeries) {
                    candleSeries = chart.addCandlestickSeries({
                        upColor: '#3fb950',
                        downColor: '#f85149',
                        borderVisible: false,
                        wickUpColor: '#3fb950',
                        wickDownColor: '#f85149',
                    });
                }

                if (candleSeries) {
                    const initialData = [];
                    let baseTime = Math.floor(Date.now() / 1000) - 1000;
                    let basePrice = assetName?.includes('BTC') ? 62000 : 1.08;
                    for (let i = 0; i < 100; i++) {
                        const open = basePrice + (Math.random() - 0.5) * (basePrice * 0.002);
                        const high = open + Math.random() * (basePrice * 0.001);
                        const low = open - Math.random() * (basePrice * 0.001);
                        const close = (high + low) / 2;
                        initialData.push({ time: baseTime + i * 10, open, high, low, close });
                        basePrice = close;
                    }
                    candleSeries.setData(initialData);
                }

                chartRef.current = chart;
                setLoading(false);

                const handleResize = () => {
                    if (chartContainerRef.current && chartRef.current) {
                        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
                    }
                };

                window.addEventListener('resize', handleResize);

                return () => {
                    window.removeEventListener('resize', handleResize);
                    chart.remove();
                };
            } catch (err) {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [assetName]);

    return (
        <div className="glass-panel" style={{ padding: '24px', flex: 1, minHeight: '480px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3fb950', boxShadow: '0 0 10px #3fb950', animation: 'pulse 2s infinite' }} />
                    <h2 style={{ fontSize: '1.4rem', color: '#fff' }}>{assetName} <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '1rem' }}>/ USD</span></h2>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#3fb950', fontWeight: 'bold' }}>LIVE MARKET DATA</div>
                </div>
            </div>

            {loading && (
                <div style={{ position: 'absolute', inset: '80px 24px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10, 12, 16, 0.8)', zIndex: 10, borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div className="scanner-line" style={{ color: 'var(--accent-primary)', fontSize: '14px', textAlign: 'center' }}>
                        <div style={{ marginBottom: '10px' }}>Analyzing Market Trends...</div>
                        <div style={{ width: '200px', height: '2px', background: 'var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', height: '100%', width: '30%', background: 'var(--accent-primary)', animation: 'slide 1.5s infinite linear' }} />
                        </div>
                    </div>
                </div>
            )}

            <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }} />

            <style dangerouslySetInnerHTML={{
                __html: `
            @keyframes pulse {
                0% { opacity: 0.4; }
                50% { opacity: 1; }
                100% { opacity: 0.4; }
            }
            @keyframes slide {
                from { left: -30%; }
                to { left: 130%; }
            }
        `}} />
        </div>
    );
});


export default TradingChart;
