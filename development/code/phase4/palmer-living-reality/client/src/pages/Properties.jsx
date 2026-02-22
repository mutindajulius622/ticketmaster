import React, { useState, useEffect } from 'react';
import { propertyService } from '../services/api';
import PropertyCard from '../components/PropertyCard';

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    min_rent: '',
    max_rent: '',
    location: '',
    bedrooms: '',
    for_rent: 'true',
    for_sale: ''
  });

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.min_rent) params.min_rent = filters.min_rent;
      if (filters.max_rent) params.max_rent = filters.max_rent;
      if (filters.location) params.location = filters.location;
      if (filters.bedrooms) params.bedrooms = filters.bedrooms;
      if (filters.for_rent) params.for_rent = filters.for_rent;
      if (filters.for_sale) params.for_sale = filters.for_sale;

      const response = await propertyService.getAll(params);
      setProperties(response.data);
    } catch {
      // Silently handle error - page will show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitFilters = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      min_rent: '',
      max_rent: '',
      location: '',
      bedrooms: '',
      for_rent: 'true',
      for_sale: ''
    });
    fetchProperties();
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="container" style={{ paddingTop: 'calc(var(--navbar-height) + 2rem)' }}>
      <div className="page-header">
        <h1 className="page-title">Browse Properties</h1>
        <p className="page-subtitle">Find your perfect apartment, mansion, or bungalow</p>
      </div>

      {/* Filter Toggle */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button 
          className="btn btn-secondary"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
          {activeFiltersCount > 0 && (
            <span className="badge badge-primary" style={{ marginLeft: '0.5rem' }}>
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Section */}
      {showFilters && (
        <div className="filter-section">
          <form onSubmit={handleSubmitFilters}>
            <div className="filter-row">
              <div className="filter-group form-group">
                <label className="form-label">Property Type</label>
                <select 
                  name="type" 
                  className="form-select" 
                  value={filters.type}
                  onChange={handleFilterChange}
                >
                  <option value="">All Types</option>
                  <option value="apartment">Apartment</option>
                  <option value="mansion">Mansion</option>
                  <option value="bungalow">Bungalow</option>
                </select>
              </div>

              <div className="filter-group form-group">
                <label className="form-label">Min Rent ($)</label>
                <input 
                  type="number" 
                  name="min_rent" 
                  className="form-input" 
                  placeholder="0"
                  value={filters.min_rent}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="filter-group form-group">
                <label className="form-label">Max Rent ($)</label>
                <input 
                  type="number" 
                  name="max_rent" 
                  className="form-input" 
                  placeholder="10000"
                  value={filters.max_rent}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="filter-group form-group">
                <label className="form-label">Location</label>
                <input 
                  type="text" 
                  name="location" 
                  className="form-input" 
                  placeholder="City or Area"
                  value={filters.location}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="filter-group form-group">
                <label className="form-label">Min Bedrooms</label>
                <select 
                  name="bedrooms" 
                  className="form-select" 
                  value={filters.bedrooms}
                  onChange={handleFilterChange}
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </div>
            </div>

            <div className="filter-row mt-2" style={{ alignItems: 'center' }}>
              <div className="filter-group form-group" style={{ flex: 2 }}>
                <label className="form-label">Listing Type</label>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={filters.for_rent === 'true'}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        for_rent: e.target.checked ? 'true' : '' 
                      }))}
                    />
                    <span>For Rent</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={filters.for_sale === 'true'}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        for_sale: e.target.checked ? 'true' : '' 
                      }))}
                    />
                    <span>For Sale</span>
                  </label>
                </div>
              </div>

              <div className="filter-group form-group" style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary">
                  Apply Filters
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleClearFilters}>
                  Clear
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Results Count */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
          {loading ? 'Searching...' : `${properties.length} properties found`}
        </p>
      </div>

      {/* Results */}
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : properties.length > 0 ? (
        <div className="property-grid">
          {properties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🏠</div>
          <h3 className="empty-state-title">No properties match your filters</h3>
          <p className="empty-state-text">Try adjusting your search criteria to find more properties</p>
          <button className="btn btn-primary mt-3" onClick={handleClearFilters}>
            Clear All Filters
          </button>
        </div>
      )}

      {/* Quick Stats */}
      {!loading && properties.length > 0 && (
        <div style={{ 
          marginTop: '3rem',
          padding: '2rem',
          background: 'white',
          borderRadius: 'var(--border-radius-lg)',
          boxShadow: 'var(--shadow)'
        }}>
          <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Property Insights</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1.5rem',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                {properties.length}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Properties</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary-600)' }}>
                {properties.filter(p => p.is_for_rent).length}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>For Rent</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-600)' }}>
                {properties.filter(p => p.is_for_sale).length}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>For Sale</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                ${Math.round(properties.reduce((sum, p) => sum + p.rent_amount, 0) / properties.length).toLocaleString()}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Avg. Rent/mo</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Properties;

