import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEvents } from '../redux/slices/eventsSlice';
import { setFilters } from '../redux/slices/eventsSlice';
import { Link } from 'react-router-dom';
import { FaSearch, FaMapMarkerAlt, FaCalendar, FaStar, FaSpinner } from 'react-icons/fa';

const HomePage = () => {
  const dispatch = useDispatch();
  const { events, loading, filters, pagination } = useSelector((state) => state.events);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    dispatch(fetchEvents({ page: 1, ...filters }));
  }, [dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setFilters({ search: searchTerm }));
    dispatch(fetchEvents({ page: 1, search: searchTerm, ...filters }));
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    dispatch(setFilters({ category }));
    dispatch(fetchEvents({ page: 1, category, ...filters }));
  };

  const categories = ['music', 'sports', 'technology', 'business', 'entertainment', 'education'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">Ticketmaster United States</h1>
          <p className="text-lg md:text-xl mb-8">The ultimate destination for live events</p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2 bg-white p-2 rounded-full shadow-lg">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for artists, venues, and events"
              className="flex-1 px-5 py-3 rounded-full text-gray-800 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 transition"
            >
              <FaSearch /> Search
            </button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 py-12">
        {/* Highlights Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Highlights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Example Highlight - replace with dynamic data */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img src="https://via.placeholder.com/300x150?text=Featured+Event" alt="Highlight" className="w-full h-36 object-cover" />
              <div className="p-4">
                <h3 className="font-bold text-lg">Featured Concert</h3>
                <p className="text-sm text-gray-600">Major Arena</p>
              </div>
            </div>
            {/* Repeat for other highlights */}
          </div>
        </section>

        {/* Promoted Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Promoted Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Placeholder for promoted events */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img src="https://via.placeholder.com/300x150?text=Promoted+Event" alt="Promoted Event" className="w-full h-36 object-cover" />
              <div className="p-4">
                <h3 className="font-bold text-lg">Special Offer</h3>
                <p className="text-sm text-gray-600">Venue Name</p>
              </div>
            </div>
          </div>
        </section>

        {/* Category Filter */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Categories</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryFilter('')}
              className={`px-4 py-2 rounded-full font-semibold transition ${!selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryFilter(cat)}
                className={`px-4 py-2 rounded-full font-semibold transition capitalize ${selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <FaSpinner className="animate-spin text-3xl text-blue-600" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-2xl text-gray-600">No events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden group transform hover:-translate-y-2 transition-all duration-300"
              >
                <div className="relative">
                  <img
                    src={event.image_url || 'https://via.placeholder.com/300x200?text=Event'}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow-md">
                    <div className="flex items-center gap-1">
                      <FaStar className="text-yellow-500" />
                      <span className="text-sm font-bold">{event.average_rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1 mb-3 truncate">{event.description}</p>

                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-red-500 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaCalendar className="text-blue-500 flex-shrink-0" />
                      <span>{new Date(event.start_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold capitalize">
                      {event.category}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => dispatch(fetchEvents({ page, ...filters }))}
                className={`px-4 py-2 rounded transition ${page === pagination.page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;