import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserTickets, transferTicket } from '../redux/slices/ticketsSlice';
import ticketService from '../services/ticketService';
import {
  FaTicketAlt,
  FaCalendar,
  FaMapMarkerAlt,
  FaSpinner,
  FaDownload,
  FaExchangeAlt,
  FaInfoCircle,
  FaChevronRight,
  FaQrcode,
  FaEnvelope
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import TransferModal from '../components/TransferModal';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { tickets, loading } = useSelector((state) => state.tickets);
  const { user } = useSelector((state) => state.auth);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [sendingEmailId, setSendingEmailId] = useState(null);

  useEffect(() => {
    dispatch(fetchUserTickets({ page: 1, limit: 20 }));
  }, [dispatch]);

  const handleOpenTransfer = (ticket) => {
    if (ticket.status !== 'confirmed') {
      toast.warning('Only confirmed tickets can be transferred.');
      return;
    }
    setSelectedTicket(ticket);
    setIsTransferModalOpen(true);
  };

  const handleTransferSubmit = async (ticketId, transferData) => {
    setIsTransferring(true);
    try {
      const resultAction = await dispatch(transferTicket({ ticketId, transferData }));
      if (transferTicket.fulfilled.match(resultAction)) {
        setTimeout(() => {
          dispatch(fetchUserTickets({ page: 1, limit: 20 }));
        }, 600);
      } else {
        toast.error(resultAction.payload || 'Failed to transfer ticket');
        throw new Error(resultAction.payload);
      }
    } catch (err) {
      toast.error(err.message || 'An unexpected error occurred');
      throw err;
    } finally {
      setIsTransferring(false);
    }
  };

  const handleEmailTicket = async (ticketId) => {
    setSendingEmailId(ticketId);
    try {
      await ticketService.emailTicket(ticketId);
      toast.success('Ticket sent to your email!');
    } catch (err) {
      toast.error('Failed to send email. Please try again.');
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleDownload = async (ticket) => {
    setDownloadingId(ticket.id);
    try {
      // api interceptor unwraps response.data automatically, so res IS the data
      const data = await ticketService.downloadTicket(ticket.id);

      const canvas = document.createElement('canvas');
      const W = 900, H = 360;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');

      // Blue gradient background (left stub)
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#0047b3');
      grad.addColorStop(1, '#026cdf');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // White content area (right portion)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(280, 0);
      ctx.lineTo(W, 0);
      ctx.lineTo(W, H);
      ctx.lineTo(280, H);
      ctx.closePath();
      ctx.fill();

      // Dashed perforation line
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(280, 0);
      ctx.lineTo(280, H);
      ctx.stroke();
      ctx.setLineDash([]);

      // LEFT PANEL — event title word-wrapped
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      const title = data.event_title || ticket.event_title || 'EVENT';
      const words = title.split(' ');
      let lines = [], line = '';
      for (const w of words) {
        if ((line + w).length > 16) { lines.push(line.trim()); line = w + ' '; }
        else line += w + ' ';
      }
      if (line.trim()) lines.push(line.trim());
      lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, 140, 80 + i * 28));

      // Date (large)
      const eventDate = data.event_date ? new Date(data.event_date) : null;
      ctx.font = 'bold 26px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(
        eventDate ? eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
        140, 200
      );
      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillText(
        eventDate ? eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' }) : '',
        140, 225
      );

      // Location
      ctx.font = '13px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText((data.event_location || ticket.event_location || '').slice(0, 24), 140, 270);

      // Ticket number
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '11px Arial';
      ctx.fillText('TICKET #', 140, 320);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(data.ticket_number || ticket.ticket_number || '', 140, 340);

      // RIGHT PANEL
      ctx.textAlign = 'left';
      const rx = 310;

      // Event title
      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(title.slice(0, 38) + (title.length > 38 ? '…' : ''), rx, 50);

      // Tier badge
      const tier = (data.ticket_type_tier || ticket.ticket_type_tier || 'regular').toUpperCase();
      const tierColor = tier === 'VVIP' ? '#ca8a04' : tier === 'VIP' ? '#7c3aed' : '#026cdf';
      ctx.fillStyle = tierColor;
      ctx.beginPath();
      ctx.roundRect(rx, 62, 60, 20, 4);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px Arial';
      ctx.fillText(tier, rx + 8, 76);

      // Info grid
      const infos = [
        ['DATE', eventDate ? eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) : '—'],
        ['TIME', eventDate ? eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'],
        ['VENUE', (data.event_location || ticket.event_location || '—').slice(0, 40)],
        ['SECTION', data.seat_details?.section || ticket.seat_details?.section || '—'],
        ['ROW / SEAT', `${data.seat_details?.row || '—'} / ${data.seat_details?.seat_number || '—'}`],
        ['PRICE', `$${data.price ?? ticket.price ?? '—'}`],
      ];
      infos.forEach(([label, val], i) => {
        const y = 110 + i * 36;
        ctx.fillStyle = '#999';
        ctx.font = '10px Arial';
        ctx.fillText(label, rx, y);
        ctx.fillStyle = '#111';
        ctx.font = 'bold 13px Arial';
        ctx.fillText(String(val), rx, y + 17);
      });

      // QR code section
      const qrRaw = data.qr_code || ticket.qr_code;
      const qrX = W - 155, qrY = H / 2 - 58, qrSize = 116;

      const finalize = () => {
        ctx.fillStyle = '#999';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Scan to enter', qrX + qrSize / 2, qrY + qrSize + 14);
        ctx.fillStyle = '#ccc';
        ctx.font = '9px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(data.ticket_number || ticket.ticket_number || '', W - 10, H - 10);
        ctx.textAlign = 'left';

        const link = document.createElement('a');
        link.download = `ticket-${(data.ticket_number || ticket.ticket_number || 'ticket').replace(/[^a-zA-Z0-9-]/g, '')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setDownloadingId(null);
        toast.success('Ticket downloaded!');
      };

      if (qrRaw) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { ctx.drawImage(img, qrX, qrY, qrSize, qrSize); finalize(); };
        img.onerror = () => {
          ctx.fillStyle = '#f3f4f6';
          ctx.fillRect(qrX, qrY, qrSize, qrSize);
          ctx.fillStyle = '#aaa';
          ctx.font = '11px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('QR', qrX + qrSize / 2, qrY + qrSize / 2);
          ctx.textAlign = 'left';
          finalize();
        };
        img.src = qrRaw.startsWith('http') ? qrRaw : `data:image/png;base64,${qrRaw}`;
      } else {
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(qrX, qrY, qrSize, qrSize);
        finalize();
      }
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Could not download ticket. Please try again.');
      setDownloadingId(null);
    }
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-5xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Crunching your tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20">
      {/* Header Section */}
      <div className="bg-[#026CDF] text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight uppercase">My Tickets</h1>
              <div className="flex items-center gap-3">
                <img
                  src={user?.profile_picture || `https://ui-avatars.com/api/?name=${user?.first_name}+${user?.last_name}&background=random`}
                  className="w-10 h-10 rounded-full border-2 border-white/30"
                  alt="Profile"
                />
                <p className="text-xl font-medium opacity-90">Welcome, {user?.first_name} {user?.last_name}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 min-w-[140px]">
                <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Total Assets</p>
                <p className="text-3xl font-black">{tickets.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 min-w-[140px]">
                <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Active</p>
                <p className="text-3xl font-black">{tickets.filter(t => t.status === 'confirmed').length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-10">
        {/* Main Content */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-blue-900/10 overflow-hidden border border-gray-100">
          <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="bg-blue-600 p-2 rounded-lg text-white"><FaTicketAlt /></span>
              Active Tickets
            </h2>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 font-medium">
              <FaInfoCircle />
              Click a ticket to view details or initiate actions
            </div>
          </div>

          <div className="p-6">
            {tickets.length === 0 ? (
              <div className="py-20 text-center">
                <div className="inline-block p-6 bg-blue-50 rounded-full mb-6">
                  <FaTicketAlt className="text-6xl text-blue-200" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No tickets found</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-8">
                  You haven't purchased any tickets yet. Explore the hottest events and secure your spot today!
                </p>
                <button className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                  Find Events
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {tickets.map((ticket) => {
                  // ── parse real date ──────────────────────────────────────
                  const dateObj = ticket.event_date
                    ? new Date(ticket.event_date)
                    : ticket.created_at
                      ? new Date(ticket.created_at)
                      : null;
                  const monthStr = dateObj
                    ? dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase()
                    : '—';
                  const dayStr = dateObj ? dateObj.getDate() : '—';
                  const yearStr = dateObj ? dateObj.getFullYear() : '';

                  // ── status colour ────────────────────────────────────────
                  const statusStyles = {
                    confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
                    used: 'bg-green-100 text-green-700 border-green-200',
                    cancelled: 'bg-red-100 text-red-600 border-red-200',
                    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                    refunded: 'bg-purple-100 text-purple-700 border-purple-200',
                  };
                  const statusClass = statusStyles[ticket.status] || 'bg-gray-100 text-gray-600 border-gray-200';
                  const canTransfer = ticket.status === 'confirmed';

                  return (
                    <div
                      key={ticket.id}
                      className="group relative bg-white border-2 border-gray-100 rounded-2xl overflow-hidden hover:border-blue-400 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />

                      <div className="p-6 md:p-8">
                        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">

                          {/* Date Column */}
                          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl min-w-[90px] border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                            <span className="text-xs font-bold text-blue-600 uppercase">{monthStr}</span>
                            <span className="text-3xl font-black text-gray-900">{dayStr}</span>
                            <span className="text-xs font-medium text-gray-500">{yearStr}</span>
                          </div>

                          {/* Details */}
                          <div className="flex-1">
                            <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-blue-600 transition-colors leading-tight">
                              {ticket.event_title || 'Event'}
                            </h3>
                            <div className="flex flex-wrap gap-3 text-sm font-medium text-gray-600">
                              {ticket.event_location && (
                                <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                                  <FaMapMarkerAlt className="text-blue-500" />
                                  {ticket.event_location}
                                </span>
                              )}
                              {dateObj && (
                                <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                                  <FaCalendar className="text-blue-500" />
                                  {dateObj.toLocaleString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-black uppercase ${statusClass}`}>
                                {ticket.status}
                              </span>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-6">
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Section</p>
                                <p className="font-bold text-gray-800">{ticket.seat_details?.section || '—'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Row</p>
                                <p className="font-bold text-gray-800">{ticket.seat_details?.row || '—'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Seat</p>
                                <p className="font-bold text-gray-800">{ticket.seat_details?.seat_number || '—'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tier</p>
                                <p className="font-bold text-blue-600 uppercase text-xs">{ticket.ticket_type_tier || 'Regular'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</p>
                                <p className="font-bold text-gray-800">${ticket.price}</p>
                              </div>
                              <div className="ml-auto">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ticket #</p>
                                <p className="font-mono text-xs text-gray-600">{ticket.ticket_number}</p>
                              </div>
                            </div>
                          </div>

                          {/* QR Code Module */}
                          <div className="hidden xl:flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-100 rounded-2xl group-hover:bg-white group-hover:border-blue-100 transition-colors">
                            {ticket.qr_code ? (
                              <div className="relative group/qr">
                                <img
                                  src={ticket.qr_code.startsWith('http') ? ticket.qr_code : `data:image/png;base64,${ticket.qr_code}`}
                                  alt="Ticket QR"
                                  className="w-20 h-20 opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-blue-600/10 opacity-0 group-hover/qr:opacity-100 transition-opacity rounded-lg">
                                  <FaQrcode className="text-blue-600" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-20 h-20 flex flex-col items-center justify-center text-gray-300">
                                <FaQrcode className="text-2xl mb-1" />
                                <span className="text-[8px] font-bold">NO CODE</span>
                              </div>
                            )}
                            <p className="text-[9px] font-black text-gray-400 mt-2 uppercase">Scan to Enter</p>
                          </div>

                          {/* Actions */}
                          <div className="w-full lg:w-auto flex flex-row lg:flex-col gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-8">
                            <button
                              onClick={() => handleOpenTransfer(ticket)}
                              disabled={!canTransfer}
                              title={canTransfer ? 'Transfer this ticket' : `Cannot transfer a ${ticket.status} ticket`}
                              className={`flex-1 lg:w-40 px-4 py-3 border-2 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm
                                ${canTransfer
                                  ? 'border-blue-600 text-blue-600 bg-white hover:bg-blue-600 hover:text-white cursor-pointer'
                                  : 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed'
                                }`}
                            >
                              <FaExchangeAlt /> Transfer
                            </button>
                            <button
                              onClick={() => handleDownload(ticket)}
                              disabled={downloadingId === ticket.id}
                              className="flex-1 lg:w-40 px-4 py-3 bg-[#026CDF] text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200 text-sm disabled:opacity-60 disabled:cursor-wait"
                            >
                              {downloadingId === ticket.id
                                ? <><FaSpinner className="animate-spin text-xs" /> Generating…</>
                                : <><FaDownload className="text-xs" /> Download</>
                              }
                            </button>
                            <button
                              onClick={() => handleEmailTicket(ticket.id)}
                              disabled={sendingEmailId === ticket.id}
                              className="flex-1 lg:w-40 px-4 py-3 bg-white border-2 border-gray-100 text-sm font-bold rounded-xl hover:border-gray-300 transition flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                              {sendingEmailId === ticket.id
                                ? <><FaSpinner className="animate-spin text-xs" /> Sending…</>
                                : <><FaEnvelope className="text-xs" /> Email Me</>
                              }
                            </button>
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg text-xl"><FaInfoCircle /></div>
            <div>
              <h4 className="font-bold text-gray-900">Need Help?</h4>
              <p className="text-sm text-gray-500">Contact our support 24/7</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg text-xl"><FaTicketAlt /></div>
            <div>
              <h4 className="font-bold text-gray-900">Digital Tickets</h4>
              <p className="text-sm text-gray-500">How to use your phone to enter</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg text-xl"><FaChevronRight /></div>
            <div>
              <h4 className="font-bold text-gray-900">View Account</h4>
              <p className="text-sm text-gray-500">Manage your profile and settings</p>
            </div>
          </div>
        </div>
      </div>

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onTransfer={handleTransferSubmit}
        ticket={selectedTicket}
        loading={isTransferring}
      />
    </div>
  );
};

export default DashboardPage;
