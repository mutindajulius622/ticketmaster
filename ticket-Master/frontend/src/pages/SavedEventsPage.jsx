import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSavedEvents, toggleSaveEvent } from '../redux/slices/eventsSlice';
import { Link } from 'react-router-dom';
import { FaTrash, FaMapMarkerAlt, FaCalendar, FaSpinner, FaHeart } from 'react-icons/fa';
import { toast } from 'react-toastify';

const SavedEventsPage = () => {
  const dispatch = useDispatch();
  const { savedEvents, loading } = useSelector((state) => state.events);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchSavedEvents());
    }
  }, [dispatch, isAuthenticated]);

  const handleRemove = async (eventId) => {
    const result = await dispatch(toggleSaveEvent({ eventId, isSaved: true }));
    if (result.payload) {
      toast.info('Event removed from favorites');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to see your saved events</h2>
          <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <FaHeart className="text-red-500 text-3xl" />
          <h1 className="text-4xl font-bold">Saved Events</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <FaSpinner className="animate-spin text-4xl text-blue-600" />
          </div>
        ) : savedEvents.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-xl text-gray-500 mb-6 font-medium">You haven't saved any events yet.</p>
            <Link to="/" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold transition">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col hover:shadow-xl transition-shadow relative group">
                <img
                  src={event.image_url || 'https://via.placeholder.com/400x200?text=Event'}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />

                <button
                  onClick={() => handleRemove(event.id)}
                  className="absolute top-4 right-4 bg-white/90 hover:bg-red-50 text-red-500 p-2.5 rounded-full shadow-md transition-colors z-10"
                  title="Remove from favorites"
                >
                  <FaTrash />
                </button>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">{event.title}</h3>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaMapMarkerAlt className="text-red-500" />
                      <span className="text-sm font-medium truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaCalendar className="text-blue-500" />
                      <span className="text-sm font-medium">
                        {new Date(event.start_date).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <Link
                      to={`/events/${event.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition text-center flex-1 shadow-md shadow-blue-200"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedEventsPage;
