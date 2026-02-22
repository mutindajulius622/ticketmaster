import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { FaClock, FaMapMarkerAlt, FaDollarSign, FaCalendar } from 'react-icons/fa';
import AdvancedSearch from '../components/AdvancedSearch';
import { searchEvents, addRecentSearch } from '../redux/slices/searchSlice';

const SearchPage = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { results, loading, error, totalResults } = useSelector((state) => state.search);

  useEffect(() => {
    // Parse URL search params and trigger search
    const params = {
      search: searchParams.get('q') || '',
      category: searchParams.get('category') || undefined,
      location: searchParams.get('location') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      priceMin: searchParams.get('priceMin') ? parseFloat(searchParams.get('priceMin')) : undefined,
      priceMax: searchParams.get('priceMax') ? parseFloat(searchParams.get('priceMax')) : undefined,
      tags: searchParams.get('tags') || undefined,
      page: 1,
      limit: 20,
    };

    if (Object.values(params).some((v) => v)) {
      dispatch(searchEvents(params));
      if (params.search) {
        dispatch(
          addRecentSearch({
            query: params.search,
            timestamp: new Date().toISOString(),
          })
        );
      }
    }
  }, [searchParams, dispatch]);

  const handleSearch = (filters) => {
    // Update URL and trigger search
    const queryParams = new URLSearchParams();
    if (filters.search) queryParams.set('q', filters.search);
    if (filters.category) queryParams.set('category', filters.category);
    if (filters.location) queryParams.set('location', filters.location);
    if (filters.startDate) queryParams.set('startDate', filters.startDate);
    if (filters.endDate) queryParams.set('endDate', filters.endDate);
    if (filters.priceMin) queryParams.set('priceMin', filters.priceMin);
    if (filters.priceMax) queryParams.set('priceMax', filters.priceMax);
    if (filters.tags) queryParams.set('tags', filters.tags);

    window.history.pushState({}, '', `/search?${queryParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-2">Find Your Event</h1>
        <p className="text-gray-600 mb-8">
          Search from thousands of events happening near you
        </p>

        <AdvancedSearch onSearch={handleSearch} />

        {/* Results Section */}
        <div>
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-800 font-semibold">Error loading results</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 text-lg">No events found</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                Found <span className="font-semibold">{totalResults}</span> event
                {totalResults !== 1 ? 's' : ''}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden cursor-pointer"
                    onClick={() => (window.location.href = `/events/${event.id}`)}
                  >
                    {/* Event Image */}
                    {event.image_url && (
                      <div className="w-full h-48 bg-gray-300 overflow-hidden">
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover hover:scale-105 transition"
                        />
                      </div>
                    )}

                    {/* Event Info */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold flex-1 line-clamp-2">{event.title}</h3>
                        {event.featured && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded ml-2">
                            Featured
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">{event.description}</p>

                      {/* Event Details */}
                      <div className="space-y-2 text-sm text-gray-600">
                        {event.start_date && (
                          <div className="flex items-center gap-2">
                            <FaCalendar className="text-blue-500 flex-shrink-0" />
                            <span>
                              {new Date(event.start_date).toLocaleDateString()} at{' '}
                              {new Date(event.start_date).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        )}

                        {event.location && (
                          <div className="flex items-center gap-2">
                            <FaMapMarkerAlt className="text-red-500 flex-shrink-0" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        )}

                        {event.category && (
                          <div className="flex items-center gap-2">
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                              {event.category}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
