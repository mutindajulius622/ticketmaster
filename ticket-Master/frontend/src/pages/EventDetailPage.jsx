import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventDetail } from '../redux/slices/eventsSlice';
import { toast } from 'react-toastify';
import { FaMapMarkerAlt, FaCalendar, FaStar, FaUsers, FaTicketAlt, FaSpinner } from 'react-icons/fa';

const EventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentEvent, loading } = useSelector((state) => state.events);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchEventDetail(eventId));
  }, [eventId, dispatch]);

  const handleBookTicket = (ticketTypeId) => {
    if (!isAuthenticated) {
      toast.warning('Please login to book tickets');
      navigate('/login');
      return;
    }
    navigate(`/checkout/${ticketTypeId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl text-gray-600">Event not found</p>
      </div>
    );
  }

  const event = currentEvent;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-blue-600 hover:text-blue-800 font-semibold"
        >
          ← Back to Events
        </button>

        {/* Event Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <img
              src={event.image_url || 'https://via.placeholder.com/600x400?text=Event'}
              alt={event.title}
              className="w-full h-96 object-cover rounded-lg mb-6"
            />

            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
              
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <div className="flex items-center gap-2">
                  <FaStar className="text-yellow-400" />
                  <span className="font-semibold">{event.average_rating.toFixed(1)}/5</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaUsers className="text-blue-600" />
                  <span>{event.total_attendees} attendees</span>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold capitalize">
                  {event.category}
                </span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-4">
                  <FaMapMarkerAlt className="text-red-500 mt-1" />
                  <div>
                    <p className="font-semibold">Location</p>
                    <p className="text-gray-600">{event.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <FaCalendar className="text-green-500 mt-1" />
                  <div>
                    <p className="font-semibold">Date & Time</p>
                    <p className="text-gray-600">
                      {new Date(event.start_date).toLocaleDateString()}{' '}
                      {new Date(event.start_date).toLocaleTimeString()} -{' '}
                      {new Date(event.end_date).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">About This Event</h2>
                <p className="text-gray-700 leading-relaxed">{event.description}</p>
              </div>

              {event.tags && event.tags.length > 0 && (
                <div className="mt-6">
                  <p className="font-semibold mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reviews Section */}
            {event.reviews && event.reviews.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Reviews</h2>
                <div className="space-y-4">
                  {event.reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex text-yellow-400">
                          {[...Array(review.rating)].map((_, i) => (
                            <FaStar key={i} size={14} />
                          ))}
                        </div>
                        <span className="font-semibold">{review.title}</span>
                      </div>
                      <p className="text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ticket Booking Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-2xl font-bold mb-6">Get Tickets</h2>

              {event.ticket_types && event.ticket_types.length > 0 ? (
                <div className="space-y-4">
                  {event.ticket_types.map((ticketType) => {
                    const available = ticketType.quantity - ticketType.sold;
                    return (
                      <div
                        key={ticketType.id}
                        className="border rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-lg">{ticketType.name}</h3>
                            <p className="text-sm text-gray-600 capitalize">{ticketType.type}</p>
                          </div>
                          <span className="text-2xl font-bold text-blue-600">
                            KES {ticketType.price}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                          {available > 0 ? (
                            <span>{available} tickets available</span>
                          ) : (
                            <span className="text-red-600 font-semibold">Sold Out</span>
                          )}
                        </p>

                        <button
                          onClick={() => handleBookTicket(ticketType.id)}
                          disabled={available === 0}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          <FaTicketAlt /> Book Now
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-600 text-center">No tickets available</p>
              )}

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  💡 <strong>Tip:</strong> Book early for better prices and early-bird discounts!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
