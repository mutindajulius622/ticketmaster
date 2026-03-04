import React, { useState } from 'react';
import {
    FaTimes, FaExchangeAlt, FaUser, FaEnvelope,
    FaPen, FaCheckCircle, FaTicketAlt, FaArrowRight, FaSpinner
} from 'react-icons/fa';

const TransferModal = ({ isOpen, onClose, onTransfer, ticket, loading }) => {
    const [step, setStep] = useState('form'); // 'form' | 'confirm' | 'done'
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        note: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleReview = (e) => {
        e.preventDefault();
        setStep('confirm');
    };

    const handleConfirm = async () => {
        await onTransfer(ticket.id, formData);
        setStep('done');
    };

    const handleClose = () => {
        setStep('form');
        setFormData({ first_name: '', last_name: '', email: '', note: '' });
        onClose();
    };

    if (!isOpen) return null;

    // ── Ticket summary mini card ──────────────────────────────────────────────
    const TicketInfo = () => (
        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                <FaTicketAlt className="text-white" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wider text-blue-400">Ticket Being Transferred</p>
                <p className="font-bold text-gray-900 truncate">{ticket?.event_title || 'Event'}</p>
                <p className="text-xs font-mono text-gray-500">{ticket?.ticket_number}</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{ animation: 'fadeIn 0.2s ease-out' }}>

                {/* Header */}
                <div className="bg-[#026CDF] px-6 py-5 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                            <FaExchangeAlt className="text-sm" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black leading-none">Transfer Ticket</h2>
                            <p className="text-blue-200 text-xs mt-0.5">
                                {step === 'form' && 'Enter recipient details'}
                                {step === 'confirm' && 'Please review before sending'}
                                {step === 'done' && 'Transfer complete!'}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition">
                        <FaTimes />
                    </button>
                </div>

                {/* Step Dots */}
                <div className="flex gap-1.5 justify-center pt-4 pb-0">
                    {['form', 'confirm', 'done'].map((s, i) => (
                        <div
                            key={s}
                            className={`h-1.5 rounded-full transition-all ${step === s ? 'w-6 bg-blue-600' : 'w-1.5 bg-gray-200'
                                }`}
                        />
                    ))}
                </div>

                {/* ── Step 1: Form ─────────────────────────────────────── */}
                {step === 'form' && (
                    <form onSubmit={handleReview} className="p-6 space-y-4">
                        <TicketInfo />

                        <div className="grid grid-cols-2 gap-3">
                            {/* First Name */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1.5">First Name</label>
                                <div className="relative">
                                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                    <input
                                        type="text" name="first_name" required
                                        value={formData.first_name} onChange={handleChange}
                                        placeholder="John"
                                        className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition"
                                    />
                                </div>
                            </div>
                            {/* Last Name */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1.5">Last Name</label>
                                <div className="relative">
                                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                    <input
                                        type="text" name="last_name" required
                                        value={formData.last_name} onChange={handleChange}
                                        placeholder="Doe"
                                        className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1.5">Recipient Email</label>
                            <div className="relative">
                                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="email" name="email" required
                                    value={formData.email} onChange={handleChange}
                                    placeholder="recipient@email.com"
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition"
                                />
                            </div>
                        </div>

                        {/* Note */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1.5">Personal Note (Optional)</label>
                            <div className="relative">
                                <FaPen className="absolute left-3 top-3 text-gray-400 text-xs" />
                                <textarea
                                    name="note" rows={3}
                                    value={formData.note} onChange={handleChange}
                                    placeholder="Enjoy the show! 🎉"
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition resize-none"
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button type="button" onClick={handleClose}
                                className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition text-sm">
                                Cancel
                            </button>
                            <button type="submit"
                                className="flex-1 py-3 bg-[#026CDF] text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2 text-sm">
                                Review <FaArrowRight className="text-xs" />
                            </button>
                        </div>
                    </form>
                )}

                {/* ── Step 2: Confirm ──────────────────────────────────── */}
                {step === 'confirm' && (
                    <div className="p-6 space-y-4">
                        <TicketInfo />

                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
                            <p className="font-black text-xs uppercase tracking-wider mb-2">⚠️ Please Confirm</p>
                            <p>You are about to permanently transfer this ticket. This action <strong>cannot be undone</strong>.</p>
                        </div>

                        {/* Recipient summary */}
                        <div className="border border-gray-100 rounded-2xl p-4 space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">Transferring To</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm">
                                    {formData.first_name[0]}{formData.last_name[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{formData.first_name} {formData.last_name}</p>
                                    <p className="text-sm text-gray-500">{formData.email}</p>
                                </div>
                            </div>
                            {formData.note && (
                                <div className="mt-3 pl-3 border-l-2 border-gray-200 text-sm text-gray-500 italic">
                                    "{formData.note}"
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-gray-400 text-center">
                            A confirmation email will be sent to <strong>{formData.email}</strong>
                        </p>

                        <div className="flex gap-3">
                            <button onClick={() => setStep('form')}
                                className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition text-sm">
                                ← Back
                            </button>
                            <button onClick={handleConfirm} disabled={loading}
                                className="flex-1 py-3 bg-[#026CDF] text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2 text-sm">
                                {loading
                                    ? <><FaSpinner className="animate-spin" /> Transferring...</>
                                    : <><FaExchangeAlt /> Confirm Transfer</>
                                }
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step 3: Done ─────────────────────────────────────── */}
                {step === 'done' && (
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <FaCheckCircle className="text-4xl text-green-500" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">Transfer Complete!</h3>
                        <p className="text-gray-500 text-sm mb-1">
                            Your ticket has been transferred to
                        </p>
                        <p className="font-bold text-blue-600 mb-6">{formData.email}</p>
                        <p className="text-xs text-gray-400 mb-6">
                            They will receive a confirmation email with the ticket QR code shortly.
                        </p>
                        <button onClick={handleClose}
                            className="px-8 py-3 bg-[#026CDF] text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                            Done
                        </button>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
        </div>
    );
};

export default TransferModal;
