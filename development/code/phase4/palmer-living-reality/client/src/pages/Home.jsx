import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/PropertyCard';
import { propertyService } from '../services/api';

const Home = () => {
  const { isAuthenticated, isTenant, user } = useAuth();
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await propertyService.getAll({ for_rent: 'true' });
        setFeaturedProperties(response.data.slice(0, 6));
      } catch {
        // Set empty array on error so page still renders
        setFeaturedProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const stats = [
    { icon: '🏠', value: '500+', label: 'Properties Listed' },
    { icon: '👥', value: '1,200+', label: 'Happy Tenants' },
    { icon: '🏢', value: '50+', label: 'Property Owners' },
    { icon: '⭐', value: '4.8', label: 'Average Rating' }
  ];

  const features = [
    {
      icon: '🏢',
      title: 'Wide Selection',
      description: 'Apartments, mansions, and bungalows in prime locations',
      color: 'var(--primary-500)'
    },
    {
      icon: '🔒',
      title: 'Secure Process',
      description: 'Verified tenants and owners for your peace of mind',
      color: 'var(--secondary-500)'
    },
    {
      icon: '💰',
      title: 'Transparent Pricing',
      description: 'Clear rent amounts with no hidden fees',
      color: 'var(--accent-500)'
    },
    {
      icon: '📍',
      title: 'Prime Locations',
      description: 'Properties in the most desirable neighborhoods',
      color: 'var(--danger-500)'
    },
    {
      icon: '⚡',
      title: 'Fast Applications',
      description: 'Apply for rentals with just a few clicks',
      color: 'var(--primary-600)'
    },
    {
      icon: '💬',
      title: '24/7 Support',
      description: 'Our team is always here to help you',
      color: 'var(--secondary-600)'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Tenant',
      image: '👩',
      quote: 'Found my dream apartment in just a week! The process was so smooth.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Property Owner',
      image: '👨',
      quote: 'Managing my properties has never been easier. Highly recommend!',
      rating: 5
    },
    {
      name: 'Emily Davis',
      role: 'Tenant',
      image: '👩‍🦰',
      quote: 'The verification process gave me confidence. Great platform!',
      rating: 5
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Find Your Perfect Home</h1>
          <p className="hero-subtitle">
            Discover apartments, mansions, and bungalows for rent and sale. 
            Your dream property is just a click away with Palmer Living Reality.
          </p>
          <div className="hero-actions">
            <Link to="/properties" className="btn btn-light btn-lg">
              🏠 Browse Properties
            </Link>
            {!isAuthenticated() && (
              <Link to="/register" className="btn btn-outline btn-lg" style={{ borderColor: 'white', color: 'white' }}>
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ background: 'white', padding: '3rem 2rem', marginTop: '-2rem' }}>
        <div className="container">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1.5rem',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            {stats.map((stat, index) => (
              <div key={index} className="stat-card text-center" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                <div className="stat-value" style={{ color: 'var(--primary-600)' }}>{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tenant Notice */}
      {isTenant() && !user?.is_verified && (
        <div className="container" style={{ paddingTop: '1rem' }}>
          <div className="alert alert-warning">
            <span className="alert-icon">⏳</span>
            <div>
              <strong>Account Pending Verification:</strong> Your account is awaiting admin verification. 
              Once verified, you'll be able to apply for rental properties.
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <section className="container" style={{ padding: '4rem 2rem' }}>
        <div className="text-center mb-4">
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Why Choose Palmer Living Reality?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            We make finding your perfect property simple, secure, and stress-free
          </p>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1.5rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {features.map((feature, index) => (
            <div key={index} className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ 
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                background: `${feature.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                fontSize: '1.75rem'
              }}>
                {feature.icon}
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>{feature.title}</h3>
              <p className="card-text">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Properties */}
      <section style={{ background: 'var(--gray-50)', padding: '4rem 2rem' }}>
        <div className="container">
          <div className="page-header text-center">
            <h2 className="page-title">Featured Properties</h2>
            <p className="page-subtitle">Check out our latest and most popular listings</p>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : featuredProperties.length > 0 ? (
            <>
              <div className="property-grid">
                {featuredProperties.map(property => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
              
              <div className="text-center mt-4">
                <Link to="/properties" className="btn btn-primary btn-lg">
                  View All Properties →
                </Link>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🏠</div>
              <h3 className="empty-state-title">No properties available</h3>
              <p className="empty-state-text">Check back later for new listings</p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container" style={{ padding: '4rem 2rem' }}>
        <div className="text-center mb-4">
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            What Our Users Say
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            Join thousands of satisfied tenants and property owners
          </p>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '1.5rem',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          {testimonials.map((testimonial, index) => (
            <div key={index} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: '50%', 
                  background: 'var(--primary-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  {testimonial.image}
                </div>
                <div>
                  <h4 style={{ marginBottom: '0.25rem' }}>{testimonial.name}</h4>
                  <span className="badge badge-info">{testimonial.role}</span>
                </div>
              </div>
              <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>"{testimonial.quote}"</p>
              <div style={{ color: 'var(--accent-500)' }}>
                {'⭐'.repeat(testimonial.rating)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated() && (
        <section style={{ background: 'var(--bg-gradient)', padding: '4rem 2rem' }}>
          <div className="container text-center">
            <div className="card" style={{ 
              padding: '3rem', 
              background: 'rgba(255, 255, 255, 0.95)',
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              <h2 style={{ marginBottom: '1rem', color: 'var(--primary-700)' }}>
                Ready to Find Your Dream Home?
              </h2>
              <p style={{ marginBottom: '2rem', fontSize: '1.125rem' }}>
                Create an account today and start browsing thousands of properties
              </p>
              <div className="hero-actions" style={{ justifyContent: 'center' }}>
                <Link to="/register" className="btn btn-primary btn-xl">
                  Get Started Now
                </Link>
                <Link to="/properties" className="btn btn-outline btn-xl">
                  Browse Properties
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer Info */}
      <section style={{ background: 'var(--gray-900)', color: 'white', padding: '3rem 2rem' }}>
        <div className="container">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '2rem',
            textAlign: 'center'
          }}>
            <div>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>🏠 Palmer Living Reality</h3>
              <p style={{ color: 'var(--gray-400)' }}>
                Your trusted partner in finding the perfect rental property
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: '1rem' }}>Quick Links</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link to="/properties" style={{ color: 'var(--gray-400)' }}>Browse Properties</Link>
                <Link to="/register" style={{ color: 'var(--gray-400)' }}>Create Account</Link>
                <Link to="/login" style={{ color: 'var(--gray-400)' }}>Login</Link>
              </div>
            </div>
            <div>
              <h4 style={{ marginBottom: '1rem' }}>Property Types</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--gray-400)' }}>
                <span>🏢 Apartments</span>
                <span>🏰 Mansions</span>
                <span>🏡 Bungalows</span>
              </div>
            </div>
            <div>
              <h4 style={{ marginBottom: '1rem' }}>Contact</h4>
              <p style={{ color: 'var(--gray-400)' }}>
                Email: info@palmerliving.com<br />
                Phone: (555) 123-4567
              </p>
            </div>
          </div>
          <div style={{ 
            textAlign: 'center', 
            marginTop: '3rem', 
            paddingTop: '2rem',
            borderTop: '1px solid var(--gray-700)',
            color: 'var(--gray-500)'
          }}>
            <p>© 2024 Palmer Living Reality. All rights reserved.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

