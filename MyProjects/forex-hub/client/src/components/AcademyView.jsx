import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, PlayCircle, CheckCircle, Lock, Trophy, ArrowRight, Play, Zap } from 'lucide-react';
import authService from '../services/authService';

const courses = [
    {
        id: 'smc-101',
        title: 'Institutional Order Flow',
        description: 'Understand how big banks move the market. Learn to identify supply and demand zones.',
        level: 'Intermediate',
        lessons: 8,
        progress: 100,
        image: 'https://images.unsplash.com/photo-1611974717482-480927ff74d5?q=80&w=400&auto=format&fit=crop',
        price: 0,
        content: [
            {
                phase: 'Beginner: The Institutional Footprint',
                detail: 'Institutions (Central Banks, Hedge Funds) don\'t trade like retail. They use Large Orders that create visible footprints. Learn to stop looking at indicators and start looking at price displacement.'
            },
            {
                phase: 'Intermediate: Order Blocks & Mitigation',
                detail: 'An Order Block is a change in state of delivery. It represents where smart money has entered. We look for "Mitigation"—the return to these blocks to pick up remaining orders before the true move happens.'
            },
            {
                phase: 'Expert: Order Flow Dominance',
                detail: 'Mastering the HTF (Higher Timeframe) narrative. Learn to align M15 entries with H4/Daily order flow to achieve 1:10+ risk-to-reward ratios via institutional alignment.'
            }
        ]
    },
    {
        id: 'liquidity',
        title: 'Mastering Market Liquidity',
        description: 'Learn to avoid retail traps. Identify where buy-side and sell-side liquidity is resting.',
        level: 'Advanced',
        lessons: 12,
        progress: 45,
        image: 'https://images.unsplash.com/photo-1640341667852-2b3b0cf653ca?q=80&w=400&auto=format&fit=crop',
        price: 0,
        content: [
            {
                phase: 'Beginner: Liquidity Basics',
                detail: 'Liquidity is fuel. Markets move from liquidity to liquidity. Retail "Stop Losses" are the liquidity institutions need to fill their large positions.'
            },
            {
                phase: 'Intermediate: The Retail Trap (Inducement)',
                detail: 'Double Tops and Bottoms are not reversals; they are targets. Learn how Smart Money "induces" retail traders to enter early, only to sweep their stops before the real move.'
            },
            {
                phase: 'Expert: Liquidity Sweeps & Reversals',
                detail: 'Master the "External vs Internal" liquidity cycles. Learn to identify when a "Sweep" of a Previous Daily High (PDH) is a signal for a deep institutional reversal.'
            }
        ]
    },
    {
        id: 'fvg-pro',
        title: 'Fair Value Gaps (FVG)',
        description: 'Technical mastery of market imbalances and how to trade the re-entry.',
        level: 'Advanced',
        lessons: 6,
        progress: 0,
        image: 'https://images.unsplash.com/photo-1611974717414-046603a151b7?q=80&w=400&auto=format&fit=crop',
        price: 100,
        content: [
            {
                phase: 'Beginner: Identifying Imbalance',
                detail: 'FVGs are 3-candle patterns where the market moves too fast, leaving a gap. This is an "Inefficiency" that the algorithm will almost always return to fill.'
            },
            {
                phase: 'Intermediate: Break of Structure (BOS)',
                detail: 'An FVG is only powerful when accompanied by a BOS and displacement. Learn to differentiate between a "lazy" gap and a "violent" institutional displacement.'
            },
            {
                phase: 'Expert: Pro-Level Entries (OTE)',
                detail: 'Combining FVGs with the Fibonacci Optimal Trade Entry (70.5%-79%). Learn to set your entry at the "Consequent Encroachment" (50% level) of the gap for maximum precision.'
            }
        ]
    }
];

const AcademyView = ({ user, onUserUpdate }) => {
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [loading, setLoading] = useState(false);

    const isUnlocked = (courseId) => {
        if (!user) return false;
        if (user.role === 'ADMIN') return true;
        const targetCourse = courses.find(c => c.id === courseId);
        if (targetCourse?.price === 0) return true;
        return user.purchasedCourses?.includes(courseId);
    };

    const handleUnlock = async (course) => {
        if (!user) return alert("Please log in to unlock institutional modules.");
        if (user.balance < course.price) return alert("Insufficient institutional balance. Please deposit funds.");

        setLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('user')).token;
            const updatedUser = await authService.purchaseCourse(course.id, course.price, token);
            onUserUpdate(updatedUser);
            alert(`Unlocked ${course.title}! $${course.price} credited to Super Admin ledger.`);
        } catch (err) {
            alert(err.response?.data?.message || "Unlock failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '12px' }}>Institutional <span style={{ color: 'var(--accent-primary)' }}>Academy</span></h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '700px' }}>
                    Elite education for professional traders. Master the strategies used by hedge fund managers and proprietary firms.
                </p>
            </div>

            <div className="glass-panel" style={{ padding: '32px', marginBottom: '48px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-primary)' }} />
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <BookOpen size={24} color="var(--accent-primary)" /> Platform Quick Start Guide
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(88, 166, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                            <Lock size={20} color="var(--accent-primary)" />
                        </div>
                        <h4 style={{ fontSize: '15px', marginBottom: '8px', color: '#fff' }}>1. Requirements</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                            You must have a verified institutional account. Minimum balance of $10.00 is required for standard risk management execution.
                        </p>
                    </div>

                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(63, 185, 80, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                            <Play size={20} color="var(--accent-secondary)" />
                        </div>
                        <h4 style={{ fontSize: '15px', marginBottom: '8px', color: '#fff' }}>2. How to Deposit</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                            Navigate to the <b>Portfolio</b> tab. Click the <b>Deposit</b> button, enter the amount, and confirm your institutional ledger update.
                        </p>
                    </div>

                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(210, 168, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                            <Zap size={20} color="#d2a8ff" />
                        </div>
                        <h4 style={{ fontSize: '15px', marginBottom: '8px', color: '#fff' }}>3. How to Trade</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                            In your <b>Portfolio</b> view, set your <b>Lot Size</b> (0.01 to 5.0). Toggle the <b>INSTITUTIONAL AI</b> switch to 'ACTIVE' for automated SMC execution.
                        </p>
                    </div>

                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(248, 81, 73, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                            <ArrowRight size={20} color="#f85149" />
                        </div>
                        <h4 style={{ fontSize: '15px', marginBottom: '8px', color: '#fff' }}>4. Withdrawals</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                            Once profits are realized, return to the <b>Portfolio</b> tab. Click <b>Withdraw</b>, enter your profit share amount, and settle funds instantly.
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '28px' }}>
                {courses.map((course) => {
                    const unlocked = isUnlocked(course.id);
                    return (
                        <motion.div
                            key={course.id}
                            whileHover={{ y: -10 }}
                            className="glass-panel"
                            style={{
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative'
                            }}
                        >
                            <div style={{ height: '200px', width: '100%', position: 'relative' }}>
                                <img src={course.image} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, var(--bg-card))' }} />
                                {!unlocked && (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ background: 'var(--bg-main)', width: '48px', height: '48px', borderRadius: '50%', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                                <Lock size={20} color="var(--accent-primary)" />
                                            </div>
                                            <div style={{ fontWeight: '800', fontSize: '12px', color: '#fff' }}>PREMIUM MODULE</div>
                                        </div>
                                    </div>
                                )}
                                <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'var(--accent-primary)', color: '#000', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>
                                    {course.level.toUpperCase()}
                                </div>
                            </div>

                            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: '1.4rem', marginBottom: '12px' }}>{course.title}</h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.6' }}>{course.description}</p>

                                <div style={{ marginTop: 'auto' }}>
                                    {unlocked && (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                                                <span style={{ fontWeight: '700' }}>{course.progress}%</span>
                                            </div>
                                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginBottom: '24px' }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${course.progress}%` }}
                                                    style={{ height: '100%', background: 'var(--accent-primary)', borderRadius: '3px', boxShadow: '0 0 10px var(--accent-primary)' }}
                                                />
                                            </div>
                                        </>
                                    )}

                                    <button
                                        className={`btn ${!unlocked ? 'btn-secondary' : 'btn-primary'}`}
                                        disabled={loading}
                                        onClick={() => unlocked ? setSelectedCourse(course) : handleUnlock(course)}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
                                    >
                                        {loading ? 'Processing...' : !unlocked ? `Unlock for $${course.price}` : course.progress === 100 ? 'Review Module' : 'Continue Learning'}
                                        {unlocked && <ArrowRight size={18} />}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="glass-panel" style={{ marginTop: '60px', padding: '40px', display: 'flex', gap: '40px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.8rem', marginBottom: '16px' }}>Master Your Mindset</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '1.1rem' }}>
                        The difference between a 7-figure trader and a beginner is psychology. Our subconscious conditioning workshops help you eliminate emotional trading.
                    </p>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <CheckCircle size={20} color="var(--accent-secondary)" />
                            <span style={{ fontSize: '14px' }}>Fear Management</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <CheckCircle size={20} color="var(--accent-secondary)" />
                            <span style={{ fontSize: '14px' }}>Discipline Training</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <CheckCircle size={20} color="var(--accent-secondary)" />
                            <span style={{ fontSize: '14px' }}>Patience Exercises</span>
                        </div>
                    </div>
                </div>
                <div style={{ width: '300px', display: 'flex', justifyContent: 'center' }}>
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-primary), transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Trophy size={60} color="#000" />
                    </motion.div>
                </div>
            </div>

            <AnimatePresence>
                {selectedCourse && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCourse(null)}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)' }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="glass-panel"
                            style={{ position: 'relative', width: '100%', maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto', padding: '40px', zIndex: 3001 }}
                        >
                            <button
                                onClick={() => setSelectedCourse(null)}
                                style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}
                            >✕</button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                                <div style={{ background: 'var(--accent-primary)', color: '#000', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '900' }}>
                                    {selectedCourse.level.toUpperCase()}
                                </div>
                                <h2 style={{ fontSize: '2rem' }}>{selectedCourse.title}</h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                {selectedCourse.content.map((phase, idx) => (
                                    <div key={idx} style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                                        <h4 style={{ color: 'var(--accent-primary)', fontSize: '1rem', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Zap size={16} /> {phase.phase}
                                        </h4>
                                        <p style={{ color: '#fff', fontSize: '15px', lineHeight: '1.7', opacity: 0.9 }}>
                                            {phase.detail}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '40px', textAlign: 'center' }}>
                                <button className="btn btn-primary" onClick={() => setSelectedCourse(null)} style={{ padding: '14px 40px' }}>
                                    Back to Academy
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AcademyView;
