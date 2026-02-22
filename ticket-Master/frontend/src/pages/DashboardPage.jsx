import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserTickets } from '../redux/slices/ticketsSlice';
import { FaTicketAlt, FaCalendar, FaMapMarkerAlt, FaSpinner, FaDownload } from 'react-icons/fa';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { tickets, loading } = useSelector((state) => state.tickets);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchUserTickets({ page: 1, limit: 20 }));
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome back, {user?.first_name}!</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* Stats Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 mb-2">Total Tickets</p>
            <p className="text-3xl font-bold">{tickets.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 mb-2">Upcoming Events</p>
            <p className="text-3xl font-bold">
              {tickets.filter(t => t.status === 'confirmed').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 mb-2">Used Tickets</p>
            <p className="text-3xl font-bold">
              {tickets.filter(t => t.status === 'used').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 mb-2">Account Type</p>
            <p className="text-2xl font-bold capitalize">{user?.role}</p>
          </div>
        </div>

        {/* Tickets Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FaTicketAlt /> My Tickets
            </h2>
          </div>

          {tickets.length === 0 ? (
            <div className="p-12 text-center">
              <FaTicketAlt className="text-4xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No tickets yet</p>
              <p className="text-gray-500">Book an event to get started</p>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="text-sm text-gray-600">Ticket</p>
                      <p className="font-bold">{ticket.ticket_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          ticket.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : ticket.status === 'used'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Price</p>
                      <p className="font-bold">KES {ticket.price}</p>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
                        <FaDownload /> Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
