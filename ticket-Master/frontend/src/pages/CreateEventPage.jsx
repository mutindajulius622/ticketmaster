import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    FaCalendar, FaMapMarkerAlt, FaImage, FaTag, FaSpinner,
    FaTicketAlt, FaBuilding, FaChair, FaCheckCircle, FaPlus,
    FaTrash, FaChevronRight, FaChevronLeft, FaStar, FaGlobeAmericas
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../services/api';

// ─── Step Indicator ───────────────────────────────────────────────────────────
const steps = ['Event Info', 'Venue', 'Seats & Sections', 'Pricing', 'Review'];

const StepBar = ({ current }) => (
    <div className="flex items-center justify-center mb-10 gap-0">
        {steps.map((label, i) => (
            <React.Fragment key={i}>
                <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${current > i ? 'bg-blue-600 border-blue-600 text-white'
                        : current === i ? 'border-blue-600 text-blue-600 bg-white'
                            : 'border-gray-300 text-gray-400 bg-white'
                        }`}>
                        {current > i ? <FaCheckCircle /> : i + 1}
                    </div>
                    <span className={`text-[10px] mt-1 font-bold uppercase tracking-widest whitespace-nowrap ${current >= i ? 'text-blue-600' : 'text-gray-400'
                        }`}>{label}</span>
                </div>
                {i < steps.length - 1 && (
                    <div className={`h-0.5 w-10 mx-1 mb-5 transition-all ${current > i ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
            </React.Fragment>
        ))}
    </div>
);

// ─── Field Wrapper ────────────────────────────────────────────────────────────
const Field = ({ label, children, hint }) => (
    <div>
        <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1.5">{label}</label>
        {children}
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
);

const Input = (props) => (
    <input
        {...props}
        className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-gray-800 ${props.className || ''}`}
    />
);

const Select = ({ children, ...props }) => (
    <select
        {...props}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-gray-800 capitalize"
    >
        {children}
    </select>
);

// ─── Tier colour config ────────────────────────────────────────────────────────
const TIER_CONFIG = {
    vvip: { label: 'VVIP', color: '#FFD700', bg: 'bg-yellow-50', border: 'border-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
    vip: { label: 'VIP', color: '#026CDF', bg: 'bg-blue-50', border: 'border-blue-400', badge: 'bg-blue-100 text-blue-700' },
    regular: { label: 'Regular', color: '#6B7280', bg: 'bg-gray-50', border: 'border-gray-300', badge: 'bg-gray-100 text-gray-700' },
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CreateEventPage = () => {
    const navigate = useNavigate();
    const { token } = useSelector((state) => state.auth);
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const fileRef = useRef();

    // ── Form State ────────────────────────────────────────────────────────────
    const [event, setEvent] = useState({
        title: '', description: '', category: 'music',
        location: '', start_date: '', end_date: '',
        image_url: '', tags: '', is_featured: false,
    });
    const [imagePreview, setImagePreview] = useState('');
    const [imageFile, setImageFile] = useState(null);

    const [venue, setVenue] = useState({
        name: '', address: '', city: '', state: '', country: '',
    });

    const [sections, setSections] = useState([
        { name: 'VVIP Section', ticket_type: 'vvip', rows: 3, seats_per_row: 10 },
        { name: 'VIP Section', ticket_type: 'vip', rows: 5, seats_per_row: 15 },
        { name: 'Regular Section', ticket_type: 'regular', rows: 10, seats_per_row: 20 },
    ]);

    const [prices, setPrices] = useState({
        vvip: { name: 'VVIP', price: '', description: 'Premium front-row experience with backstage access' },
        vip: { name: 'VIP', price: '', description: 'Exclusive area with priority entry' },
        regular: { name: 'Regular', price: '', description: 'General admission access' },
    });

    const categories = ['music', 'sports', 'technology', 'business', 'entertainment', 'education', 'health', 'other'];

    // ── Image Upload ─────────────────────────────────────────────────────────
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const uploadImage = async () => {
        if (!imageFile) return event.image_url;
        try {
            const reader = new FileReader();
            return await new Promise((resolve) => {
                reader.onloadend = async () => {
                    try {
                        const data = await api.post('/admin/upload-image', { image: reader.result });
                        resolve(data.image_url || event.image_url);
                    } catch (err) {
                        resolve(event.image_url);
                    }
                };
                reader.readAsDataURL(imageFile);
            });
        } catch {
            return event.image_url;
        }
    };

    // ── Section helpers ──────────────────────────────────────────────────────
    const addSection = () => setSections([...sections, { name: '', ticket_type: 'regular', rows: 5, seats_per_row: 10 }]);
    const removeSection = (i) => setSections(sections.filter((_, idx) => idx !== i));
    const updateSection = (i, field, val) => {
        const updated = [...sections];
        updated[i] = { ...updated[i], [field]: val };
        setSections(updated);
    };

    // ── Seat count preview ──────────────────────────────────────────────────
    const tierSeats = (tier) => sections
        .filter(s => s.ticket_type === tier)
        .reduce((sum, s) => sum + (parseInt(s.rows) || 0) * (parseInt(s.seats_per_row) || 0), 0);

    const totalSeats = sections.reduce((sum, s) =>
        sum + (parseInt(s.rows) || 0) * (parseInt(s.seats_per_row) || 0), 0);

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        setLoading(true);
        try {
            const finalImageUrl = await uploadImage();

            const ticket_types = Object.entries(prices)
                .filter(([, v]) => parseFloat(v.price) > 0)
                .map(([type, v]) => ({ name: v.name, type, price: parseFloat(v.price), description: v.description, quantity: tierSeats(type) }));

            const payload = {
                event: { ...event, image_url: finalImageUrl, tags: event.tags.split(',').map(t => t.trim()).filter(Boolean) },
                venue,
                sections,
                ticket_types,
            };

            const data = await api.post('/admin/events/create-full', payload);

            toast.success('🎉 Event created successfully!');
            navigate(`/events/${data.event.id}`);
        } catch (err) {
            toast.error(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
    const prev = () => setStep(s => Math.max(s - 1, 0));

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#F0F2F5] pb-20">
            {/* Header */}
            <div className="bg-[#026CDF] text-white py-10 px-4 shadow-lg">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-black uppercase italic tracking-tighter">Create New Event</h1>
                    <p className="text-blue-200 text-sm mt-1">Set up your event, venue, seats, and pricing in one place</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 mt-8">
                <StepBar current={step} />

                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 min-h-[500px]">

                    {/* ── Step 0: Event Info ─────────────────────────────────────────── */}
                    {step === 0 && (
                        <div className="space-y-5">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Event Information</h2>

                            <Field label="Event Title">
                                <Input required value={event.title} onChange={e => setEvent({ ...event, title: e.target.value })} placeholder="e.g. BTS World Tour – Toronto" />
                            </Field>

                            <Field label="Description">
                                <textarea
                                    required rows={4} value={event.description}
                                    onChange={e => setEvent({ ...event, description: e.target.value })}
                                    placeholder="Tell attendees what this event is about..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-gray-800 resize-none"
                                />
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Category">
                                    <Select value={event.category} onChange={e => setEvent({ ...event, category: e.target.value })}>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </Select>
                                </Field>
                                <Field label="Location / City">
                                    <Input value={event.location} onChange={e => setEvent({ ...event, location: e.target.value })} placeholder="Rogers Centre, Toronto" />
                                </Field>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Start Date & Time">
                                    <Input type="datetime-local" value={event.start_date} onChange={e => setEvent({ ...event, start_date: e.target.value })} />
                                </Field>
                                <Field label="End Date & Time">
                                    <Input type="datetime-local" value={event.end_date} onChange={e => setEvent({ ...event, end_date: e.target.value })} />
                                </Field>
                            </div>

                            {/* Image Upload */}
                            <Field label="Event Image" hint="Upload a high-quality banner/poster for this event">
                                <div
                                    onClick={() => fileRef.current.click()}
                                    className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-400 transition group relative overflow-hidden"
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                                    ) : (
                                        <div className="py-6 text-gray-400 group-hover:text-blue-500 transition">
                                            <FaImage className="text-4xl mx-auto mb-3" />
                                            <p className="font-semibold">Click to upload image</p>
                                            <p className="text-xs">JPG, PNG, WEBP – max 10MB</p>
                                        </div>
                                    )}
                                </div>
                                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                {!imagePreview && (
                                    <div className="mt-2">
                                        <Input
                                            type="url"
                                            placeholder="…or paste an image URL"
                                            value={event.image_url}
                                            onChange={e => setEvent({ ...event, image_url: e.target.value })}
                                        />
                                    </div>
                                )}
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Tags (comma separated)">
                                    <Input value={event.tags} onChange={e => setEvent({ ...event, tags: e.target.value })} placeholder="kpop, concert, world-tour" />
                                </Field>
                                <Field label="Featured Event">
                                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                                        <input type="checkbox" id="featured" checked={event.is_featured} onChange={e => setEvent({ ...event, is_featured: e.target.checked })} className="w-4 h-4 accent-blue-600" />
                                        <label htmlFor="featured" className="text-sm text-gray-700 font-medium">Show on homepage highlights</label>
                                    </div>
                                </Field>
                            </div>
                        </div>
                    )}

                    {/* ── Step 1: Venue ──────────────────────────────────────────────── */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Venue Details</h2>
                            <Field label="Venue Name">
                                <Input value={venue.name} onChange={e => setVenue({ ...venue, name: e.target.value })} placeholder="Rogers Centre" />
                            </Field>
                            <Field label="Street Address">
                                <Input value={venue.address} onChange={e => setVenue({ ...venue, address: e.target.value })} placeholder="1 Blue Jays Way" />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="City">
                                    <Input value={venue.city} onChange={e => setVenue({ ...venue, city: e.target.value })} placeholder="Toronto" />
                                </Field>
                                <Field label="State / Province">
                                    <Input value={venue.state} onChange={e => setVenue({ ...venue, state: e.target.value })} placeholder="Ontario" />
                                </Field>
                            </div>
                            <Field label="Country">
                                <Input value={venue.country} onChange={e => setVenue({ ...venue, country: e.target.value })} placeholder="Canada" />
                            </Field>

                            {/* Capacity preview */}
                            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
                                <p className="text-xs font-black uppercase text-blue-400 mb-1">Total Capacity (from sections)</p>
                                <p className="text-3xl font-black text-blue-700">{totalSeats.toLocaleString()}</p>
                                <p className="text-xs text-blue-400 mt-1">Configured in the next step</p>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Seats & Sections ───────────────────────────────────── */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Sections & Seating</h2>
                                <button onClick={addSection} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition">
                                    <FaPlus /> Add Section
                                </button>
                            </div>

                            {/* Summary badges */}
                            <div className="flex gap-3 flex-wrap mb-2">
                                {Object.entries(TIER_CONFIG).map(([tier, cfg]) => (
                                    <span key={tier} className={`px-3 py-1 rounded-full text-xs font-bold ${cfg.badge}`}>
                                        {cfg.label}: {tierSeats(tier)} seats
                                    </span>
                                ))}
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                                    Total: {totalSeats} seats
                                </span>
                            </div>

                            <div className="space-y-4">
                                {sections.map((sec, i) => {
                                    const cfg = TIER_CONFIG[sec.ticket_type] || TIER_CONFIG.regular;
                                    return (
                                        <div key={i} className={`p-4 border-2 rounded-2xl ${cfg.border} ${cfg.bg}`}>
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                                                <input
                                                    className="flex-1 bg-transparent font-bold text-gray-800 focus:outline-none border-b border-transparent focus:border-gray-400"
                                                    value={sec.name}
                                                    onChange={e => updateSection(i, 'name', e.target.value)}
                                                    placeholder="Section name"
                                                />
                                                <button onClick={() => removeSection(i)} className="text-red-400 hover:text-red-600 ml-auto">
                                                    <FaTrash />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-gray-500">Tier</label>
                                                    <select
                                                        value={sec.ticket_type}
                                                        onChange={e => updateSection(i, 'ticket_type', e.target.value)}
                                                        className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold"
                                                    >
                                                        <option value="vvip">VVIP</option>
                                                        <option value="vip">VIP</option>
                                                        <option value="regular">Regular</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-gray-500">Rows</label>
                                                    <input
                                                        type="number" min="1" max="50"
                                                        value={sec.rows}
                                                        onChange={e => updateSection(i, 'rows', e.target.value)}
                                                        className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-gray-500">Seats / Row</label>
                                                    <input
                                                        type="number" min="1" max="50"
                                                        value={sec.seats_per_row}
                                                        onChange={e => updateSection(i, 'seats_per_row', e.target.value)}
                                                        className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Seats in this section: <strong>{(parseInt(sec.rows) || 0) * (parseInt(sec.seats_per_row) || 0)}</strong>
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Pricing ───────────────────────────────────────────── */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Ticket Pricing</h2>
                            {Object.entries(TIER_CONFIG).map(([tier, cfg]) => {
                                const seats = tierSeats(tier);
                                return (
                                    <div key={tier} className={`p-5 border-2 rounded-2xl ${cfg.border} ${cfg.bg}`}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                                            <span className="text-xs text-gray-500">{seats} seats available</span>
                                        </div>
                                        {seats === 0 ? (
                                            <p className="text-xs text-gray-400 italic">No sections configured for this tier. Go back to add one.</p>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Price (USD)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                                        <input
                                                            type="number" min="0" step="0.01"
                                                            value={prices[tier].price}
                                                            onChange={e => setPrices({ ...prices, [tier]: { ...prices[tier], price: e.target.value } })}
                                                            placeholder="0.00"
                                                            className="w-full pl-7 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition font-bold text-gray-800"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Description</label>
                                                    <input
                                                        value={prices[tier].description}
                                                        onChange={e => setPrices({ ...prices, [tier]: { ...prices[tier], description: e.target.value } })}
                                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition text-sm text-gray-700"
                                                        placeholder="What's included?"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Step 4: Review ─────────────────────────────────────────────── */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Review & Publish</h2>

                            {/* Event card preview */}
                            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                {(imagePreview || event.image_url) && (
                                    <img src={imagePreview || event.image_url} alt="Event" className="w-full h-52 object-cover" />
                                )}
                                <div className="p-5">
                                    <h3 className="font-black text-xl text-gray-900 mb-1">{event.title || 'Untitled Event'}</h3>
                                    <p className="text-sm text-gray-500">{event.description.slice(0, 120)}...</p>
                                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                                        <span className="flex items-center gap-1"><FaMapMarkerAlt className="text-blue-500" /> {event.location}</span>
                                        <span className="flex items-center gap-1"><FaCalendar className="text-blue-500" /> {event.start_date ? new Date(event.start_date).toLocaleDateString() : '—'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Venue */}
                            <div className="bg-gray-50 rounded-2xl p-4 text-sm">
                                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Venue</p>
                                <p className="font-bold text-gray-800">{venue.name}</p>
                                <p className="text-gray-500">{venue.address}, {venue.city}, {venue.country}</p>
                            </div>

                            {/* Ticket tiers */}
                            <div className="grid grid-cols-3 gap-3">
                                {Object.entries(TIER_CONFIG).map(([tier, cfg]) => {
                                    const seats = tierSeats(tier);
                                    const price = prices[tier].price;
                                    return (
                                        <div key={tier} className={`p-4 rounded-2xl border-2 text-center ${cfg.border} ${cfg.bg}`}>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                                            <p className="text-2xl font-black mt-2">${price || '0'}</p>
                                            <p className="text-xs text-gray-500 mt-1">{seats} seats</p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Seat map preview */}
                            <div className="text-center text-sm text-gray-400">
                                <FaChair className="inline mr-1" /> Total: <strong>{totalSeats}</strong> seats across <strong>{sections.length}</strong> sections
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full py-5 bg-[#026CDF] text-white font-black text-lg rounded-2xl hover:bg-blue-700 transition shadow-xl shadow-blue-200 flex items-center justify-center gap-3"
                            >
                                {loading ? <><FaSpinner className="animate-spin" /> Publishing...</> : <>🚀 Publish Event</>}
                            </button>
                        </div>
                    )}

                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6">
                    <button
                        onClick={prev}
                        disabled={step === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:border-gray-400 transition disabled:opacity-30"
                    >
                        <FaChevronLeft /> Back
                    </button>
                    {step < steps.length - 1 && (
                        <button
                            onClick={next}
                            className="flex items-center gap-2 px-8 py-3 bg-[#026CDF] text-white font-bold rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-100"
                        >
                            Continue <FaChevronRight />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateEventPage;
