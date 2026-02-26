import React, { useState, useEffect } from 'react';
import { FaSearch, FaCalendar, FaMapMarkerAlt, FaTags, FaFilter } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { fetchEvents } from '../redux/slices/eventsSlice';

const AdvancedSearch = ({ onSearch }) => {
  const dispatch = useDispatch();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    location: '',
    startDate: '',
    endDate: '',
    priceMin: 0,
    priceMax: 10000,
    tags: [],
  });
  const [savedSearches, setSavedSearches] = useState(
    JSON.parse(localStorage.getItem('savedSearches') || '[]')
  );

  const categories = [
    'all',
    'music',
    'sports',
    'technology',
    'business',
    'entertainment',
    'education',
    'health',
  ];

  const handleSearch = () => {
    const searchParams = {
      search: searchQuery,
      category: filters.category !== 'all' ? filters.category : undefined,
      location: filters.location,
      startDate: filters.startDate,
      endDate: filters.endDate,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      tags: filters.tags.join(','),
    };

    dispatch(fetchEvents({ ...searchParams, page: 1, limit: 20 }));
    onSearch?.(searchParams);
  };

  const handleSaveSearch = () => {
    const newSearch = {
      id: Date.now(),
      name: searchQuery || `Search ${new Date().toLocaleDateString()}`,
      query: searchQuery,
      filters,
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedSearches, newSearch];
    setSavedSearches(updated);
    localStorage.setItem('savedSearches', JSON.stringify(updated));
  };

  const loadSavedSearch = (search) => {
    setSearchQuery(search.query);
    setFilters(search.filters);
  };

  const deleteSavedSearch = (id) => {
    const updated = savedSearches.filter((s) => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem('savedSearches', JSON.stringify(updated));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      {/* Main Search Bar */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-4 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search events, artists, venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          Search
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="border border-gray-300 hover:bg-gray-50 px-4 py-3 rounded-lg flex items-center gap-2"
        >
          <FaFilter /> Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="border-t pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                <FaMapMarkerAlt /> Location
              </label>
              <input
                type="text"
                placeholder="City or venue"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Start Date Filter */}
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                <FaCalendar /> From
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                <FaCalendar /> To
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Price Range */}
            <div className="col-span-2">
              <label className="block text-sm font-semibold mb-2">Price Range</label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-600">Min: ${filters.priceMin}</label>
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={filters.priceMin}
                    onChange={(e) =>
                      setFilters({ ...filters, priceMin: parseInt(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-600">Max: ${filters.priceMax}</label>
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={filters.priceMax}
                    onChange={(e) =>
                      setFilters({ ...filters, priceMax: parseInt(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Tags Filter */}
            <div className="col-span-2">
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                <FaTags /> Tags
              </label>
              <input
                type="text"
                placeholder="Enter tags (comma separated)"
                value={filters.tags.join(', ')}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    tags: e.target.value.split(',').map((t) => t.trim()),
                  })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              Apply Filters
            </button>
            <button
              onClick={handleSaveSearch}
              className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold"
            >
              Save Search
            </button>
            <button
              onClick={() => {
                setFilters({
                  category: 'all',
                  location: '',
                  startDate: '',
                  endDate: '',
                  priceMin: 0,
                  priceMax: 10000,
                  tags: [],
                });
                setSearchQuery('');
              }}
              className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="border-t mt-6 pt-6">
          <h3 className="font-semibold mb-3">Saved Searches</h3>
          <div className="flex flex-wrap gap-2">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1"
              >
                <button
                  onClick={() => loadSavedSearch(search)}
                  className="text-sm hover:underline"
                >
                  {search.name}
                </button>
                <button
                  onClick={() => deleteSavedSearch(search.id)}
                  className="text-gray-500 hover:text-red-500 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
