import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { propertyService, inquiryService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const InquiryForm = () => {
  const { propertyId, inquiryType } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    user_phone: '',
    message: '',
    preferred_contact_method: 'email',
    preferred_move_in_date: ''
  });

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await propertyService.getById(propertyId);
        setProperty(response.data);
      } catch (err) {
        setError('Property not found');
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  // Pre-fill form with user data if authenticated
  useEffect(() => {
    if (isAuthenticated() && user) {
      setFormData(prev => ({
        ...prev,
        user_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '',
        user_email: user.email || '',
        user_phone: user.phone || ''
      }));
    }
  }, [isAuthenticated, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await inquiryService.create({
        property_id: parseInt(propertyId),
        inquiry_type: inquiryType,
        ...formData
      });
      
      setSuccess(true);
      
      // Redirect to home or properties page after success
      setTimeout(() => {
        navigate('/properties');
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 'calc(var(--navbar-height) + 2rem)', minHeight: '50vh' }}>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error && !property) {
    return (
      <div className="container" style={{ paddingTop: 'calc(var(--navbar-height) + 2rem)', minHeight: '50vh' }}>
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <h3 className="empty-state-title">{error}</h3>
          <p className="empty-state-text">The property you're trying to inquire about doesn't exist.</p>
          <Link to="/properties" className="btn btn-primary mt-3">
            ← Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container" style={{ paddingTop: 'calc(var(--navbar-height) + 2rem)', minHeight: '50vh' }}>
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <h3 className="empty-state-title">Inquiry Submitted Successfully!</h3>
          <p className="empty-state-text">
            Thank you for your interest in this property. The property owner will contact you soon.
          </p>
          <div className="hero-actions" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
            <Link to="/properties" className="btn btn-primary">
              Browse More Properties
            </Link>
            <Link to="/" className="btn btn-outline">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isRentInquiry = inquiryType === 'rent';
  const inquiryTitle = isRentInquiry ? 'Rental Inquiry' : 'Purchase Inquiry';
  const inquiryButtonText = isRentInquiry ? 'Submit Rental Inquiry' : 'Submit Purchase Inquiry';
  const propertyType = property?.property_type || 'Property';

  return (
    <div className="container" style={{ paddingTop: 'calc(var(--navbar-height) + 2rem)' }}>
      <div className="page-header text-center">
        <h1 className="page-title">{inquiryTitle}</h1>
        <p className="page-subtitle">
          Fill out the form below and the property owner will get back to you
        </p>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {/* Property Summary Card */}
        {property && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <img 
                src={property.image_url || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80'}
                alt={property.name}
                style={{ 
                  width: 120, 
                  height: 90, 
                  objectFit: 'cover', 
                  borderRadius: 'var(--border-radius-sm)' 
                }}
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ marginBottom: '0.25rem' }}>{property.name}</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  📍 {property.location}
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {property.is_for_rent && (
                    <span className="badge badge-success">
                      For Rent: ${property.rent_amount?.toLocaleString()}/mo
                    </span>
                  )}
                  {property.is_for_sale && (
                    <span className="badge badge-info">
                      For Sale: ${property.sale_price?.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inquiry Form */}
        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                {error}
              </div>
            )}

            {/* Contact Information */}
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
              📇 Your Contact Information
            </h3>

            <div className="form-group">
              <label className="form-label">Your Name *</label>
              <input 
                type="text" 
                name="user_name"
                className="form-input"
                value={formData.user_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input 
                  type="email" 
                  name="user_email"
                  className="form-input"
                  value={formData.user_email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input 
                  type="tel" 
                  name="user_phone"
                  className="form-input"
                  value={formData.user_phone}
                  onChange={handleChange}
                  placeholder="+254 700 000 000"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Contact Method</label>
              <select 
                name="preferred_contact_method"
                className="form-select"
                value={formData.preferred_contact_method}
                onChange={handleChange}
              >
                <option value="email">📧 Email</option>
                <option value="phone">📞 Phone Call</option>
                <option value="whatsapp">💬 WhatsApp</option>
              </select>
            </div>

            {/* Inquiry Details */}
            <h3 style={{ marginTop: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
              📝 Inquiry Details
            </h3>

            {isRentInquiry && (
              <div className="form-group">
                <label className="form-label">Preferred Move-in Date</label>
                <input 
                  type="date" 
                  name="preferred_move_in_date"
                  className="form-input"
                  value={formData.preferred_move_in_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                {isRentInquiry ? 'Your Message / Questions' : 'Your Message / Purchase Inquiry'}
              </label>
              <textarea 
                name="message"
                className="form-textarea"
                value={formData.message}
                onChange={handleChange}
                placeholder={
                  isRentInquiry 
                    ? "Tell us about yourself, your move-in plans, any questions you have about the property..."
                    : "Tell us about your purchase inquiry, preferred timeline, or any questions..."
                }
                rows={5}
                required
              />
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary btn-lg"
                style={{ flex: 1 }}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : inquiryButtonText}
              </button>
              <Link to={`/properties/${propertyId}`} className="btn btn-secondary btn-lg">
                Cancel
              </Link>
            </div>

            {/* Note for authenticated users */}
            {isAuthenticated() && (
              <p style={{ 
                marginTop: '1rem', 
                fontSize: '0.875rem', 
                color: 'var(--text-secondary)',
                textAlign: 'center'
              }}>
                💡 Your account information will be shared with the property owner for this inquiry.
              </p>
            )}

            {/* Note for guests */}
            {!isAuthenticated() && (
              <p style={{ 
                marginTop: '1rem', 
                fontSize: '0.875rem', 
                color: 'var(--text-secondary)',
                textAlign: 'center'
              }}>
                💡 Want to track your inquiries?{' '}
                <Link to="/register" style={{ color: 'var(--primary-600)' }}>
                  Create an account
                </Link> or{' '}
                <Link to="/login" style={{ color: 'var(--primary-600)' }}>
                  login
                </Link>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default InquiryForm;

