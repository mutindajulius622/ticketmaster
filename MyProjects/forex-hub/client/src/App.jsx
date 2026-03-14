import React, { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    BarChart4,
    Globe,
    Activity,
    User,
    BookOpen,
    LogOut,
    Bell,
    Layers,
    ChevronRight,
    Search,
    Loader2
} from 'lucide-react';
import io from 'socket.io-client';

import authService from './services/authService';

// Lazy Loaded Components for Performance
const TradingChart = lazy(() => import('./components/TradingChart'));
const PredictionPanel = lazy(() => import('./components/PredictionPanel'));
const AcademyView = lazy(() => import('./components/AcademyView'));
const MarketsView = lazy(() => import('./components/MarketsView'));
const UserDashboard = lazy(() => import('./components/UserDashboard'));
const AuthModal = lazy(() => import('./components/AuthModal'));

const socket = io('http://localhost:3001', {
    transports: ['websocket'],
    upgrade: false
});

// Component optimization: Memoized View Wrapper
const ViewContainer = React.memo(({ children }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
    >
        {children}
    </motion.div>
));

function App() {
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
    const [profile, setProfile] = useState(null);
    const [activeView, setActiveView] = useState('Academy');
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [selectedAsset, setSelectedAsset] = useState('EURUSD');

    const addNotification = useCallback((msg) => {
        const id = Date.now();
        setNotifications(prev => [{ id, msg }, ...prev]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);

    const logout = useCallback(() => {
        authService.logout();
        setUser(null);
        setProfile(null);
        setActiveView('Academy');
    }, []);

    const fetchProfile = useCallback(async () => {
        if (!user?.token) return;
        try {
            const data = await authService.getProfile(user.token);
            setProfile(data);
        } catch (err) {
            logout();
        }
    }, [user, logout]);

    useEffect(() => {
        socket.on('new-prediction', (prediction) => {
            setPredictions(prev => [prediction, ...prev].slice(0, 10));
            addNotification(`New Signal: ${prediction.assetId} ${prediction.signal}`);
        });

        socket.on('account-update', (data) => {
            setProfile(prev => ({
                ...(prev || {}),
                balance: data.balance,
                totalProfit: data.totalProfit
            }));
            if (data.message) addNotification(data.message);
        });

        if (user) {
            socket.emit('join', user._id);
            fetchProfile();
        }

        return () => {
            socket.off('new-prediction');
            socket.off('account-update');
        };
    }, [user, fetchProfile, addNotification]);

    const handleAuthSuccess = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        socket.emit('join', userData._id);
        fetchProfile();
    };

    const handleUpdateSettings = async (settings) => {
        if (!user) return setIsAuthModalOpen(true);
        try {
            const updated = await authService.updateSettings(settings, user.token);
            setProfile(updated);
            addNotification("Institutional settings updated.");
        } catch (err) {
            addNotification("Update failed.");
        }
    };

    const navItems = useMemo(() => [
        { id: 'Academy', icon: BookOpen, label: 'Academy' },
        { id: 'Markets', icon: Globe, label: 'Global Markets' },
        { id: 'Portfolio', icon: Activity, label: 'Portfolio' },
        { id: 'Predictions', icon: TrendingUp, label: 'AI Signals' },
    ], []);

    const LoadingFallback = () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--accent-primary)' }}>
            <Loader2 className="animate-spin" size={32} />
        </div>
    );

    return (
        <div className="app-container">
            <header className="header" style={{ backdropFilter: 'blur(20px)', zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)'
                    }}>
                        <Layers color="#fff" size={24} />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.5px' }}>
                        Forex<span style={{ color: 'var(--accent-primary)' }}>Hub</span>
                    </h1>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div className="glass-panel" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3fb950', boxShadow: '0 0 8px #3fb950' }} />
                        <span style={{ fontWeight: '600', opacity: 0.8 }}>Institutional Feed Active</span>
                    </div>

                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>ACCOUNT BALANCE</div>
                                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-primary)' }}>
                                    ${profile?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                                </div>
                            </div>
                            <div
                                onClick={() => setActiveView('Portfolio')}
                                style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                <User size={20} />
                            </div>
                            <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <LogOut size={20} />
                            </button>
                        </div>
                    ) : (
                        <button className="btn btn-primary" onClick={() => setIsAuthModalOpen(true)}>
                            Launch Terminal
                        </button>
                    )}
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <aside style={{ width: '280px', borderRight: '1px solid var(--border-color)', background: 'rgba(13, 17, 23, 0.3)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {navItems.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '14px 20px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                background: activeView === item.id ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                                color: activeView === item.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                border: activeView === item.id ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid transparent'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <item.icon size={20} />
                                <span style={{ fontWeight: '600', fontSize: '14px' }}>{item.label}</span>
                            </div>
                            {activeView === item.id && <ChevronRight size={16} />}
                        </div>
                    ))}

                    <div style={{ marginTop: 'auto' }}>
                        <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(180deg, rgba(88, 166, 255, 0.05) 0%, transparent 100%)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <Activity size={16} color="var(--accent-primary)" />
                                <span style={{ fontSize: '12px', fontWeight: '800' }}>SMC ENGINE</span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                Deep learning models analyzing institutional order flow and liquidity sweeps globally.
                            </div>
                        </div>
                    </div>
                </aside>

                <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        <Suspense fallback={<LoadingFallback />}>
                            <AnimatePresence mode="wait">
                                {activeView === 'Academy' && (
                                    <ViewContainer key="Academy">
                                        <AcademyView user={profile} onUserUpdate={setProfile} />
                                    </ViewContainer>
                                )}

                                {activeView === 'Markets' && (
                                    <ViewContainer key="Markets">
                                        <MarketsView onSelectAsset={(asset) => { setSelectedAsset(asset); setActiveView('Portfolio'); }} />
                                    </ViewContainer>
                                )}

                                {activeView === 'Portfolio' && (
                                    <ViewContainer key="Portfolio">
                                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                                <TradingChart asset={selectedAsset} />
                                                {profile && <UserDashboard user={profile} onUpdateSettings={handleUpdateSettings} onUserUpdate={setProfile} />}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
                                                    <TrendingUp size={20} color="var(--accent-primary)" /> Live Predictions
                                                </h3>
                                                <PredictionPanel predictions={predictions} />
                                            </div>
                                        </div>
                                    </ViewContainer>
                                )}

                                {activeView === 'Predictions' && (
                                    <ViewContainer key="Predictions">
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                                            {predictions.length > 0 ? (
                                                predictions.map((p, i) => (
                                                    <motion.div key={i} whileHover={{ y: -5 }} className="glass-panel" style={{ padding: '24px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                                            <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{p.assetId}</span>
                                                            <span style={{
                                                                color: p.signal === 'BUY' ? '#3fb950' : '#f85149',
                                                                fontWeight: '800',
                                                                background: p.signal === 'BUY' ? 'rgba(63, 185, 80, 0.1)' : 'rgba(248, 81, 73, 0.1)',
                                                                padding: '4px 12px',
                                                                borderRadius: '6px'
                                                            }}>{p.signal}</span>
                                                        </div>
                                                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>{p.reason}</p>
                                                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                                            <span>Confidence Match</span>
                                                            <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{p.confidence}% Logic</span>
                                                        </div>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '48px', textAlign: 'center' }}>
                                                    <Activity size={48} color="var(--accent-primary)" style={{ opacity: 0.2, marginBottom: '16px' }} />
                                                    <p style={{ color: 'var(--text-muted)' }}>Scanning institutional markets for high-probability setups...</p>
                                                </div>
                                            )}
                                        </div>
                                    </ViewContainer>
                                )}
                            </AnimatePresence>
                        </Suspense>
                    </div>
                </main>
            </div>

            <Suspense fallback={null}>
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    onAuthSuccess={handleAuthSuccess}
                />
            </Suspense>

            <div style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 10000 }}>
                {notifications.map(n => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        className="glass-panel"
                        style={{ padding: '16px 24px', borderLeft: '4px solid var(--accent-primary)', minWidth: '240px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Bell size={18} color="var(--accent-primary)" />
                            <span style={{ fontSize: '13px', fontWeight: '600' }}>{n.msg}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export default App;
