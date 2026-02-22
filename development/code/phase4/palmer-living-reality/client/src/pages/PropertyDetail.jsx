import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { propertyService, rentalService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/PropertyCard';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isTenant, user } = useAuth();
  const [property, setProperty] = useState(null);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [rentalForm, setRentalForm] = useState({
    lease_start_date: '',
    lease_end_date: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await propertyService.getById(id);
        setProperty(response.data);
        
        // Fetch similar properties
        const similarResponse = await propertyService.getAll({
          type: response.data.property_type,
          for_rent: 'true'
        });
        setSimilarProperties(
          similarResponse.data
            .filter(p => p.id !== response.data.id)
            .slice(0, 3)
        );
      } catch (err) {
        setError('Property not found');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const handleRentalSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await rentalService.create({
        property_id: parseInt(id),
        rent_amount: property.rent_amount,
        ...rentalForm
      });
      setShowRentalModal(false);
      navigate('/dashboard?success=rental');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit rental application');
    } finally {
      setSubmitting(false);
    }
  };

  const getPropertyTypeIcon = (type) => {
    switch (type) {
      case 'apartment': return '🏢';
      case 'mansion': return '🏰';
      case 'bungalow': return '🏡';
      default: return '🏠';
    }
  };

  if (loading) {
    return (
      <div className="property-detail">
        <div className="loading" style={{ minHeight: '50vh' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container" style={{ minHeight: '50vh', paddingTop: 'calc(var(--navbar-height) + 2rem)' }}>
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <h3 className="empty-state-title">{error || 'Property not found'}</h3>
          <p className="empty-state-text">The property you're looking for doesn't exist or has been removed.</p>
          <Link to="/properties" className="btn btn-primary mt-3">
            ← Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  const canRent = isAuthenticated() && isTenant() && user?.is_verified && property.is_for_rent;

  // Default image placeholder
  const defaultImage = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop';
  const images = property.image_url ? [property.image_url, defaultImage] : [defaultImage];

  return (
    <div className="property-detail">
      {/* Image Gallery */}
      <div style={{ 
        position: 'relative', 
        borderRadius: 'var(--border-radius-lg)', 
        overflow: 'hidden',
        marginBottom: '2rem'
      }}>
        <img 
          src={images[currentImageIndex]}
          alt={property.name}
          style={{ 
            width: '100%', 
            height: '500px', 
            objectFit: 'cover'
          }}
        />
        
        {/* Badges */}
        <div className="property-card-badges" style={{ top: '1.5rem' }}>
          <span className="badge badge-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
            {getPropertyTypeIcon(property.property_type)} {property.property_type}
          </span>
          {property.is_for_rent && (
            <span className="badge badge-success" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
              For Rent
            </span>
          )}
          {property.is_for_sale && (
            <span className="badge badge-warning" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
              For Sale
            </span>
          )}
        </div>

        {/* Navigation */}
        <div style={{ 
          position: 'absolute', 
          bottom: '1.5rem', 
          right: '1.5rem',
          display: 'flex',
          gap: '0.5rem'
        }}>
          <Link to="/properties" className="btn btn-secondary">
            ← Back
          </Link>
          
          {/* Inquiry Buttons */}
          {property.is_for_rent && (
            <Link 
              to={`/inquiry/rent/${id}`}
              className="btn btn-primary"
            >
              🏠 Inquire to Rent
            </Link>
          )}
          
          {property.is_for_sale && (
            <Link 
              to={`/inquiry/sale/${id}`}
              className="btn"
              style={{ 
                background: 'var(--accent-500)', 
                color: 'white',
                border: 'none'
              }}
            >
              💰 Inquire to Buy
            </Link>
          )}
        </div>
      </div>

      {/* Property Info Card */}
      <div className="property-detail-info">
        <div className="property-detail-header">
          <div>
            <h1 className="property-detail-title">{property.name}</h1>
            <p className="property-detail-location">
              📍 {property.location}
              {property.address && ` • ${property.address}`}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="property-detail-price">
              ${property.rent_amount?.toLocaleString()}
              <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/month</span>
            </div>
            {property.sale_price && (
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Or buy for ${property.sale_price?.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="property-features">
          {property.bedrooms > 0 && (
            <div className="property-feature">
              <span className="property-feature-icon">🛏️</span>
              <div>
                <div className="property-feature-text">{property.bedrooms}</div>
                <div className="property-feature-label">Bedrooms</div>
              </div>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="property-feature">
              <span className="property-feature-icon">🚿</span>
              <div>
                <div className="property-feature-text">{property.bathrooms}</div>
                <div className="property-feature-label">Bathrooms</div>
              </div>
            </div>
          )}
          {property.square_feet && (
            <div className="property-feature">
              <span className="property-feature-icon">📐</span>
              <div>
                <div className="property-feature-text">{property.square_feet?.toLocaleString()}</div>
                <div className="property-feature-label">Square Feet</div>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {property.description && (
          <div style={{ padding: '1.5rem 0' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Description</h3>
            <p style={{ lineHeight: 1.8 }}>{property.description}</p>
          </div>
        )}

        {/* Owner Info */}
        {property.owner && (
          <div className="alert alert-info" style={{ marginTop: '1.5rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>👤</span>
            <div>
              <strong>Listed by: {property.owner.username}</strong>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                Property managed by a verified owner • Contact available after application
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginTop: '1.5rem',
          flexWrap: 'wrap'
        }}>
          {!isAuthenticated() && (
            <Link to="/login" className="btn btn-primary btn-lg">
              Login to Rent
            </Link>
          )}
          {isTenant() && !user?.is_verified && (
            <div className="alert alert-warning" style={{ width: '100%' }}>
              <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>⏳</span>
              Your account is pending verification. Please wait for admin approval before applying for rentals.
            </div>
          )}
        </div>
      </div>

      {/* Similar Properties */}
      {similarProperties.length > 0 && (
        <section style={{ marginTop: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Similar Properties</h2>
          <div className="property-grid">
            {similarProperties.map(prop => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        </section>
      )}

      {/* Rental Modal */}
      {showRentalModal && (
        <div className="modal-overlay" onClick={() => setShowRentalModal(false)}>
          <div className="modal" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Rental Application</h2>
              <button className="modal-close" onClick={() => setShowRentalModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleRentalSubmit}>
              <div className="modal-body">
                {/* Property Summary */}
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  padding: '1rem',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--border-radius-sm)',
                  marginBottom: '1.5rem'
                }}>
                  <img 
                    src={images[0]}
                    alt={property.name}
                    style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8 }}
                  />
                  <div>
                    <h4 style={{ marginBottom: '0.25rem' }}>{property.name}</h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      📍 {property.location}
                    </p>
                    <p style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                      ${property.rent_amount?.toLocaleString()}/mo
                    </p>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Lease Start Date *</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={rentalForm.lease_start_date}
                    onChange={(e) => setRentalForm({ ...rentalForm, lease_start_date: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Lease End Date (Optional)</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={rentalForm.lease_end_date}
                    onChange={(e) => setRentalForm({ ...rentalForm, lease_end_date: e.target.value })}
                    min={rentalForm.lease_start_date}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Additional Notes (Optional)</label>
                  <textarea 
                    className="form-textarea"
                    value={rentalForm.notes}
                    onChange={(e) => setRentalForm({ ...rentalForm, notes: e.target.value })}
                    placeholder="Tell us a bit about yourself, your move-in plans, or any questions you have..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowRentalModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetail;

