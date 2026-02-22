import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const PropertyCard = ({ property, onFavorite, isFavorite }) => {
  const {
    id,
    name = 'Untitled Property',
    property_type = 'apartment',
    location = 'No location specified',
    rent_amount = 0,
    sale_price = 0,
    image_url,
    bedrooms = 0,
    bathrooms = 0,
    is_for_rent = false,
    is_for_sale = false
  } = property || {};

  const formatPrice = (amount) => {
    if (!amount) return 'Price on request';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPropertyTypeLabel = (type) => {
    const labels = {
      apartment: 'Apartment',
      mansion: 'Mansion',
      bungalow: 'Bungalow'
    };
    return labels[type] || type;
  };

  const getPropertyTypeColor = (type) => {
    const colors = {
      apartment: 'var(--primary-500)',
      mansion: 'var(--secondary-500)',
      bungalow: 'var(--accent-500)'
    };
    return colors[type] || 'var(--gray-500)';
  };

  const price = is_for_rent ? rent_amount : sale_price;
  const priceLabel = is_for_rent ? '/month' : '';

  return (
    <div className="property-card">
      <Link to={`/properties/${id}`} className="property-card-link">
        {/* Image Wrapper */}
        <div className="property-card-image-wrapper">
          <img
            src={image_url || `https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80`}
            alt={name}
            className="property-card-image"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80';
            }}
          />
          
          {/* Badges */}
          <div className="property-card-badges">
            <span
              className="badge"
              style={{
                background: getPropertyTypeColor(property_type),
                color: 'white'
              }}
            >
              {getPropertyTypeLabel(property_type)}
            </span>
            {is_for_rent && (
              <span className="badge badge-success">For Rent</span>
            )}
            {is_for_sale && (
              <span className="badge badge-info">For Sale</span>
            )}
          </div>

          {/* Favorite Button */}
          {onFavorite && (
            <button
              className={`property-card-favorite ${isFavorite ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFavorite(id);
              }}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="property-card-content">
          <div className="property-card-price">
            {formatPrice(price)}
            {priceLabel && <span style={{ fontSize: '0.875rem', fontWeight: 400 }}>{priceLabel}</span>}
          </div>
          
          <h3 className="property-card-title">{name}</h3>
          
          <div className="property-card-location">
            <span>📍</span>
            <span>{location}</span>
          </div>

          {/* Features */}
          {(bedrooms > 0 || bathrooms > 0) && (
            <div className="property-card-features">
              {bedrooms > 0 && (
                <div className="property-card-feature">
                  <span>🛏️</span>
                  <span>{bedrooms} {bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
                </div>
              )}
              {bathrooms > 0 && (
                <div className="property-card-feature">
                  <span>🚿</span>
                  <span>{bathrooms} {bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--gray-200)'
          }}>
            {is_for_rent && (
              <Link 
                to={`/inquiry/rent/${id}`}
                className="btn btn-primary btn-sm"
                style={{ flex: 1, textAlign: 'center' }}
                onClick={(e) => e.stopPropagation()}
              >
                🏠 Rent Now
              </Link>
            )}
            {is_for_sale && (
              <Link 
                to={`/inquiry/sale/${id}`}
                className="btn btn-info btn-sm"
                style={{ 
                  flex: 1, 
                  textAlign: 'center',
                  background: 'var(--accent-500)',
                  color: 'white',
                  border: 'none'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                💰 Buy Now
              </Link>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

PropertyCard.propTypes = {
  property: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string,
    property_type: PropTypes.string,
    location: PropTypes.string,
    rent_amount: PropTypes.number,
    sale_price: PropTypes.number,
    image_url: PropTypes.string,
    bedrooms: PropTypes.number,
    bathrooms: PropTypes.number,
    is_for_rent: PropTypes.bool,
    is_for_sale: PropTypes.bool
  }).isRequired,
  onFavorite: PropTypes.func,
  isFavorite: PropTypes.bool
};

PropertyCard.defaultProps = {
  onFavorite: null,
  isFavorite: false
};

// Fallback placeholder component for loading states
export const PropertyCardSkeleton = () => {
  return (
    <div className="property-card">
      <div className="property-card-image-wrapper">
        <div className="skeleton" style={{ height: '220px', width: '100%' }}></div>
      </div>
      <div className="property-card-content">
        <div className="skeleton" style={{ height: '32px', width: '60%', marginBottom: '0.5rem' }}></div>
        <div className="skeleton" style={{ height: '20px', width: '80%', marginBottom: '0.5rem' }}></div>
        <div className="skeleton" style={{ height: '16px', width: '40%' }}></div>
      </div>
    </div>
  );
};

export default PropertyCard;