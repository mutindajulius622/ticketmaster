import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEvents } from '../redux/slices/eventsSlice';
import SeatMap from '../components/SeatMap';
import api from '../services/api';
import {
    FaTicketAlt,
    FaUser,
    FaEnvelope,
    FaCalendar,
    FaMapMarkerAlt,
    FaCheckCircle,
    FaSpinner,
    FaDownload,
    FaChevronRight,
    FaQrcode
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const QuickTicketPage = () => {
    const dispatch = useDispatch();
    const { events, loading: eventsLoading } = useSelector((state) => state.events);

    const [step, setStep] = useState(1); // 1: Event, 2: Details, 3: Seat, 4: Result
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: ''
    });
    const [selectedSeatId, setSelectedSeatId] = useState(null);
    const [purchasing, setPurchasing] = useState(false);
    const [resultTicket, setResultTicket] = useState(null);

    useEffect(() => {
        dispatch(fetchEvents({ page: 1 }));
    }, [dispatch]);

    const handleEventSelect = (event) => {
        setSelectedEvent(event);
        setStep(2);
    };

    const handleDetailsSubmit = (e) => {
        e.preventDefault();
        setStep(3);
    };

    const handleSeatSelect = (seatIds) => {
        if (seatIds.length > 0) {
            setSelectedSeatId(seatIds[0]);
        }
    };

    const handleFinalPurchase = async () => {
        if (!selectedSeatId) {
            toast.error('Please select a seat');
            return;
        }

        setPurchasing(true);
        try {
            const payload = {
                ...formData,
                event_id: selectedEvent.id,
                seat_id: selectedSeatId
            };

            const response = await api.post('/tickets/quick-purchase', payload);
            setResultTicket(response.ticket);
            setStep(4);
            toast.success('Ticket created successfully!');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Purchase failed');
        } finally {
            setPurchasing(false);
        }
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-12">
            {[1, 2, 3, 4].map((i) => (
                <React.Fragment key={i}>
                    <div className={`flex flex-col items-center relative`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= i ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-200 text-gray-400'
                            }`}>
                            {step > i ? <FaCheckCircle /> : i}
                        </div>
                        <span className={`text-[10px] absolute -bottom-6 font-black uppercase tracking-widest whitespace-nowrap ${step >= i ? 'text-blue-600' : 'text-gray-400'
                            }`}>
                            {i === 1 ? 'Event' : i === 2 ? 'Details' : i === 3 ? 'Seat' : 'Done'}
                        </span>
                    </div>
                    {i < 4 && (
                        <div className={`w-12 h-1 mx-2 rounded-full transition-all duration-300 ${step > i ? 'bg-blue-600' : 'bg-gray-200'
                            }`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F0F2F5] pb-20">
            {/* Header */}
            <div className="bg-[#026CDF] text-white py-12 px-4 shadow-lg shadow-blue-900/10">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-4xl font-black mb-2 tracking-tighter uppercase italic">Quick Ticket</h1>
                    <p className="text-blue-100 font-medium">Select, Pay, and Receive your QR ticket instantly</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 mt-8">
                {renderStepIndicator()}

                <div className="bg-white rounded-3xl shadow-2xl p-8 min-h-[500px] border border-gray-100">

                    {/* Step 1: Event Selection */}
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">Choose Your Event</h2>
                            {eventsLoading ? (
                                <div className="flex justify-center py-20"><FaSpinner className="animate-spin text-4xl text-blue-600" /></div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {events.map(event => (
                                        <div
                                            key={event.id}
                                            onClick={() => handleEventSelect(event)}
                                            className="group cursor-pointer bg-white border-2 border-gray-100 rounded-2xl overflow-hidden hover:border-blue-500 hover:shadow-xl transition-all"
                                        >
                                            <img src={event.image_url || 'https://via.placeholder.com/400x200?text=Event'} alt={event.title} className="w-full h-40 object-cover" />
                                            <div className="p-4">
                                                <h3 className="font-bold text-lg group-hover:text-blue-600 truncate">{event.title}</h3>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                                    <FaMapMarkerAlt className="text-blue-500" /> {event.location}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                    <FaCalendar className="text-blue-500" /> {new Date(event.start_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Guest Details */}
                    {step === 2 && (
                        <div className="max-w-md mx-auto animate-in fade-in zoom-in duration-300">
                            <div className="text-center mb-8">
                                <div className="inline-block p-4 bg-blue-50 rounded-full mb-4 text-blue-600 text-2xl"><FaUser /></div>
                                <h2 className="text-2xl font-bold text-gray-900">Guest Checkout</h2>
                                <p className="text-gray-500">Your ticket will be sent to this email</p>
                            </div>

                            <form onSubmit={handleDetailsSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-1">First Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-1">Last Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-1">Email Address</label>
                                    <div className="relative">
                                        <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            required
                                            type="email"
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                            placeholder="email@example.com"
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-4 bg-[#026CDF] text-white font-bold rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group"
                                >
                                    Continue to Seat Selection <FaChevronRight className="group-hover:translate-x-1 transition" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full py-3 text-gray-500 font-bold hover:text-gray-700 transition"
                                >
                                    Change Event
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Step 3: Seat Selection */}
                    {step === 3 && (
                        <div className="animate-in fade-in duration-300">
                            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Choose Your Seat</h2>
                                    <p className="text-gray-500">Pick the best spot in {selectedEvent?.location}</p>
                                </div>
                                <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-100 flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase opacity-60">Selected</p>
                                        <p className="font-bold">{selectedSeatId ? '1 Seat Selected' : 'No Seat Selected'}</p>
                                    </div>
                                    <button
                                        disabled={!selectedSeatId || purchasing}
                                        onClick={handleFinalPurchase}
                                        className="px-6 py-2 bg-white text-blue-600 font-black rounded-xl hover:bg-blue-50 transition disabled:opacity-50"
                                    >
                                        {purchasing ? <FaSpinner className="animate-spin" /> : 'CONFIRM'}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-3xl border border-dashed border-gray-300">
                                <SeatMap venueId={selectedEvent?.venue_id} onReserve={handleSeatSelect} />
                            </div>
                        </div>
                    )}

                    {/* Step 4: Success / Result */}
                    {step === 4 && resultTicket && (
                        <div className="max-w-md mx-auto animate-in fade-in zoom-in duration-500">
                            <div className="text-center mb-8">
                                <div className="inline-block p-4 bg-green-50 rounded-full mb-4 text-green-600 text-3xl shadow-inner animate-bounce"><FaCheckCircle /></div>
                                <h2 className="text-3xl font-black text-gray-900">Ticket Ready!</h2>
                                <p className="text-gray-500">A copy of your ticket was sent to <b>{formData.email}</b></p>
                            </div>

                            {/* Digital Ticket UI */}
                            <div className="relative bg-white border-2 border-gray-100 rounded-3xl shadow-xl overflow-hidden">
                                <div className="bg-blue-600 p-6 text-white text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Electronic Ticket</p>
                                    <h3 className="text-xl font-bold truncate">{selectedEvent?.title}</h3>
                                </div>

                                <div className="p-8 flex flex-col items-center">
                                    <div className="w-48 h-48 bg-gray-50 rounded-2xl flex items-center justify-center p-2 border-2 border-gray-100">
                                        {resultTicket.qr_code ? (
                                            <img src={`data:image/png;base64,${resultTicket.qr_code}`} alt="QR Code" className="w-full h-full" />
                                        ) : (
                                            <FaQrcode className="text-7xl text-gray-200" />
                                        )}
                                    </div>
                                    <p className="mt-4 font-mono text-xs text-gray-400 font-bold">{resultTicket.ticket_number}</p>

                                    <div className="w-full mt-8 pt-8 border-t border-dashed border-gray-200 grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Section</p>
                                            <p className="font-bold text-gray-800">{resultTicket.seat_details?.section || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Row</p>
                                            <p className="font-bold text-gray-800">{resultTicket.seat_details?.row || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Seat</p>
                                            <p className="font-bold text-gray-800">{resultTicket.seat_details?.seat_number || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute left-0 top-[50%] -translate-x-1/2 w-6 h-6 bg-[#F0F2F5] rounded-full border border-gray-100 shadow-inner"></div>
                                <div className="absolute right-0 top-[50%] translate-x-1/2 w-6 h-6 bg-[#F0F2F5] rounded-full border border-gray-100 shadow-inner"></div>
                            </div>

                            <div className="mt-8 space-y-3">
                                <button className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition shadow-lg flex items-center justify-center gap-2">
                                    <FaDownload /> Download PDF
                                </button>
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="w-full py-3 text-blue-600 font-bold hover:text-blue-800 transition"
                                >
                                    Return to Home
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default QuickTicketPage;
