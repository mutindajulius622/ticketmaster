import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { rentalService, propertyService } from '../services/api';
import PropertyCard from '../components/PropertyCard';

const Dashboard = () => {
  const { user, isAdmin, isOwner, isTenant } = useAuth();
  const [searchParams] = useSearchParams();
  const [agreements, setAgreements] = useState([]);
  const [myProperties, setMyProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const agreementsRes = await rentalService.getAll();
        setAgreements(agreementsRes.data);

        if (isOwner()) {
          const propertiesRes = await propertyService.getAll();
          const myProps = propertiesRes.data.filter(p => p.owner_id === user?.id);
          setMyProperties(myProps);
        }
      } catch {
        // Silently handle error - page will show empty state
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'terminated': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  const getRoleInfo = () => {
    switch (user?.role) {
      case 'admin':
        return {
          icon: '⚙️',
          color: 'var(--danger-500)',
          description: 'Full system access - manage users, properties, and agreements'
        };
      case 'owner':
        return {
          icon: '🏢',
          color: 'var(--primary-500)',
          description: 'Manage your properties and view rental applications'
        };
      case 'tenant':
        return {
          icon: '🏠',
          color: 'var(--secondary-500)',
          description: 'Browse properties and manage your rental applications'
        };
      default:
        return { icon: '👤', color: 'var(--gray-500)', description: '' };
    }
  };

  const roleInfo = getRoleInfo();

  const myAgreements = agreements.filter(a => {
    if (isAdmin()) return true;
    if (isOwner()) return myProperties.some(p => p.id === a.property?.id);
    if (isTenant()) return a.tenant_id === user?.id;
    return false;
  });

  const activeAgreements = myAgreements.filter(a => a.status === 'active');
  const pendingAgreements = myAgreements.filter(a => a.status === 'pending');

  return (
    <div className="container" style={{ paddingTop: 'calc(var(--navbar-height) + 2rem)' }}>
      {/* Welcome Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: 64, 
            height: 64, 
            borderRadius: '50%', 
            background: `${roleInfo.color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem'
          }}>
            {roleInfo.icon}
          </div>
          <div>
            <h1 className="page-title">Welcome back, {user?.username}!</h1>
            <p className="page-subtitle">{roleInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Message from URL params */}
      {searchParams.get('message') === 'verification-pending' && (
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>📋</span>
          <div>
            <strong>Account Created!</strong> Your account is now pending verification by an administrator. 
            You will be notified once your account is approved.
          </div>
        </div>
      )}

      {searchParams.get('success') === 'rental' && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>✅</span>
          <div>
            <strong>Rental Application Submitted!</strong> Your application has been submitted successfully. 
            The property owner will review it shortly.
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary" style={{ background: `${roleInfo.color}20`, color: roleInfo.color }}>
            {roleInfo.icon}
          </div>
          <div className="stat-value" style={{ textTransform: 'capitalize' }}>{user?.role}</div>
          <div className="stat-label">Your Role</div>
        </div>
        
        {isTenant() && (
          <div className="stat-card">
            <div className="stat-icon stat-icon-warning">
              {user?.is_verified ? '✅' : '⏳'}
            </div>
            <div className="stat-value">
              {user?.is_verified ? 'Verified' : 'Pending'}
            </div>
            <div className="stat-label">Account Status</div>
          </div>
        )}

        <div className="stat-card">
          <div className="stat-icon stat-icon-success">📋</div>
          <div className="stat-value">{myAgreements.length}</div>
          <div className="stat-label">Total Agreements</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--secondary-100)', color: 'var(--secondary-600)' }}>✅</div>
          <div className="stat-value">{activeAgreements.length}</div>
          <div className="stat-label">Active Rentals</div>
        </div>

        {isOwner() && (
          <div className="stat-card">
            <div className="stat-icon stat-icon-primary">🏠</div>
            <div className="stat-value">{myProperties.length}</div>
            <div className="stat-label">My Properties</div>
          </div>
        )}

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-100)', color: 'var(--accent-600)' }}>⏳</div>
          <div className="stat-value">{pendingAgreements.length}</div>
          <div className="stat-label">Pending</div>
        </div>
      </div>

      {/* Tenant Verification Notice */}
      {isTenant() && !user?.is_verified && (
        <div className="alert alert-warning" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <span style={{ fontSize: '2rem' }}>⏳</span>
            <div>
              <h3 style={{ marginBottom: '0.5rem' }}>Account Verification Pending</h3>
              <p>Your account is currently awaiting verification by an administrator. 
                 This is a required security measure to ensure a safe rental community.</p>
              <div style={{ marginTop: '1rem' }}>
                <strong>What happens next?</strong>
                <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                  <li>An administrator will review your account</li>
                  <li>Once approved, you will receive a confirmation</li>
                  <li>After verification, you can apply for rental properties</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role-specific Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* My Agreements Section */}
        <div>
          <div className="flex-between mb-3">
            <h2>📋 My Rental Agreements</h2>
            {isTenant() && user?.is_verified && (
              <Link to="/properties" className="btn btn-primary">
                Browse Properties
              </Link>
            )}
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : myAgreements.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Location</th>
                    <th>Rent</th>
                    <th>Start Date</th>
                    <th>Status</th>
                    <th>Verified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myAgreements.map(agreement => (
                    <tr key={agreement.id}>
                      <td>
                        <Link to={`/properties/${agreement.property?.id}`} style={{ fontWeight: 600 }}>
                          {agreement.property?.name || 'Unknown'}
                        </Link>
                      </td>
                      <td>{agreement.property?.location || 'N/A'}</td>
                      <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                        ${agreement.rent_amount?.toLocaleString()}/mo
                      </td>
                      <td>{new Date(agreement.lease_start_date).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(agreement.status)}`}>
                          {agreement.status}
                        </span>
                      </td>
                      <td>
                        {agreement.verified ? (
                          <span className="badge badge-success">✓</span>
                        ) : (
                          <span className="badge badge-warning">Pending</span>
                        )}
                      </td>
                      <td>
                        <Link 
                          to={`/properties/${agreement.property?.id}`}
                          className="btn btn-sm btn-outline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3 className="empty-state-title">No rental agreements yet</h3>
              <p className="empty-state-text">
                {isTenant() && user?.is_verified 
                  ? 'Browse available properties and apply for a rental'
                  : 'Your rental agreements will appear here once you apply'}
              </p>
              {isTenant() && user?.is_verified && (
                <Link to="/properties" className="btn btn-primary mt-3">
                  Browse Properties
                </Link>
              )}
            </div>
          )}
        </div>

        {/* My Properties Section (for owners) */}
        {isOwner() && myProperties.length > 0 && (
          <div>
            <div className="flex-between mb-3">
              <h2>🏠 My Properties</h2>
              <Link to="/owner" className="btn btn-primary">
                Manage Properties
              </Link>
            </div>
            <div className="property-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {myProperties.slice(0, 3).map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div>
          <h2 className="mb-3">🚀 Quick Actions</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem' 
          }}>
            <Link to="/properties" className="card" style={{ padding: '1.5rem', textDecoration: 'none' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏠</div>
              <h4 style={{ marginBottom: '0.25rem' }}>Browse Properties</h4>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>View all available listings</p>
            </Link>
            
            {isAdmin() && (
              <Link to="/admin" className="card" style={{ padding: '1.5rem', textDecoration: 'none' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚙️</div>
                <h4 style={{ marginBottom: '0.25rem' }}>Admin Panel</h4>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>System administration</p>
              </Link>
            )}
            
            {isOwner() && (
              <Link to="/owner" className="card" style={{ padding: '1.5rem', textDecoration: 'none' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢</div>
                <h4 style={{ marginBottom: '0.25rem' }}>My Properties</h4>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>Manage your listings</p>
              </Link>
            )}
            
            <Link to="/properties" className="card" style={{ padding: '1.5rem', textDecoration: 'none' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
              <h4 style={{ marginBottom: '0.25rem' }}>Pricing</h4>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>View rental rates</p>
            </Link>
            
            <Link to="/properties" className="card" style={{ padding: '1.5rem', textDecoration: 'none' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📍</div>
              <h4 style={{ marginBottom: '0.25rem' }}>Locations</h4>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>Browse by area</p>
            </Link>
            
            <Link to="/properties" className="card" style={{ padding: '1.5rem', textDecoration: 'none' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢</div>
              <h4 style={{ marginBottom: '0.25rem' }}>Apartments</h4>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>Apartment listings</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

