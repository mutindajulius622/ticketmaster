
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userService, propertyService, rentalService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add padding for navbar
  const pageStyle = {
    paddingTop: 'calc(var(--navbar-height) + 2rem)'
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, propertiesRes, agreementsRes] = await Promise.all([
        userService.getAll(),
        propertyService.getAll(),
        rentalService.getAll()
      ]);
      setUsers(usersRes.data);
      setProperties(propertiesRes.data);
      setAgreements(agreementsRes.data);
    } catch {
      // Silently handle error - page will show empty state
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTenant = async (userId, isVerified) => {
    try {
      await userService.verifyTenant(userId, isVerified);
      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_verified: isVerified } : u
      ));
    } catch (error) {
      alert('Failed to update user verification');
    }
  };

  const handleVerifyAgreement = async (agreementId, verified) => {
    try {
      await rentalService.update(agreementId, { verified, status: verified ? 'active' : 'pending' });
      setAgreements(agreements.map(a => 
        a.id === agreementId ? { ...a, verified, status: verified ? 'active' : 'pending' } : a
      ));
    } catch (error) {
      alert('Failed to update agreement');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.delete(userId);
        setUsers(users.filter(u => u.id !== userId));
      } catch (error) {
        alert('Failed to delete user');
      }
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await propertyService.delete(propertyId);
        setProperties(properties.filter(p => p.id !== propertyId));
      } catch (error) {
        alert('Failed to delete property');
      }
    }
  };

  const pendingTenants = users.filter(u => u.role === 'tenant' && !u.is_verified);
  const verifiedTenants = users.filter(u => u.role === 'tenant' && u.is_verified);
  const owners = users.filter(u => u.role === 'owner');
  const pendingAgreements = agreements.filter(a => !a.verified);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return 'badge-danger';
      case 'owner': return 'badge-info';
      case 'tenant': return 'badge-success';
      default: return 'badge-info';
    }
  };

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '50vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container" style={pageStyle}>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">System administration and management</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{users.length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{pendingTenants.length}</div>
          <div className="stat-label">Pending Verifications</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{properties.length}</div>
          <div className="stat-label">Total Properties</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{pendingAgreements.length}</div>
          <div className="stat-label">Pending Agreements</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0' }}>
          {['overview', 'users', 'properties', 'agreements'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '1rem 2rem',
                border: 'none',
                background: activeTab === tab ? 'var(--primary-600)' : 'transparent',
                color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 500,
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* Pending Tenant Verifications */}
          {pendingTenants.length > 0 && (
            <div className="card mb-4">
              <div className="card-body">
                <h3 className="card-title mb-3">🔔 Pending Tenant Verifications</h3>
                <div className="table-container" style={{ boxShadow: 'none' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingTenants.map(tenant => (
                        <tr key={tenant.id}>
                          <td>{tenant.username}</td>
                          <td>{tenant.email}</td>
                          <td>{tenant.phone || 'N/A'}</td>
                          <td>{new Date(tenant.created_at).toLocaleDateString()}</td>
                          <td>
                            <div className="flex gap-1">
                              <button 
                                className="btn btn-success btn-sm"
                                onClick={() => handleVerifyTenant(tenant.id, true)}
                              >
                                Verify
                              </button>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteUser(tenant.id)}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Pending Agreements */}
          {pendingAgreements.length > 0 && (
            <div className="card mb-4">
              <div className="card-body">
                <h3 className="card-title mb-3">📋 Pending Agreement Verifications</h3>
                <div className="table-container" style={{ boxShadow: 'none' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Tenant</th>
                        <th>Rent</th>
                        <th>Start Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingAgreements.map(agreement => (
                        <tr key={agreement.id}>
                          <td>{agreement.property?.name || 'Unknown'}</td>
                          <td>{agreement.tenant?.username || 'Unknown'}</td>
                          <td>${agreement.rent_amount?.toLocaleString()}/mo</td>
                          <td>{new Date(agreement.lease_start_date).toLocaleDateString()}</td>
                          <td>
                            <div className="flex gap-1">
                              <button 
                                className="btn btn-success btn-sm"
                                onClick={() => handleVerifyAgreement(agreement.id, true)}
                              >
                                Approve
                              </button>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => handleVerifyAgreement(agreement.id, false)}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {pendingTenants.length === 0 && pendingAgreements.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <h3>All caught up!</h3>
              <p>No pending verifications at the moment</p>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card">
          <div className="card-body">
            <h3 className="card-title mb-3">All Users</h3>
            <div className="table-container" style={{ boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        {user.role === 'tenant' ? (
                          user.is_verified ? (
                            <span className="badge badge-success">Verified</span>
                          ) : (
                            <span className="badge badge-warning">Pending</span>
                          )
                        ) : (
                          <span className="badge badge-success">Active</span>
                        )}
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-1">
                          {user.role === 'tenant' && !user.is_verified && (
                            <button 
                              className="btn btn-success btn-sm"
                              onClick={() => handleVerifyTenant(user.id, true)}
                            >
                              Verify
                            </button>
                          )}
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Properties Tab */}
      {activeTab === 'properties' && (
        <div className="card">
          <div className="card-body">
            <h3 className="card-title mb-3">All Properties</h3>
            {properties.length > 0 ? (
              <div className="table-container" style={{ boxShadow: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th>Rent</th>
                      <th>Owner</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map(property => (
                      <tr key={property.id}>
                        <td>{property.id}</td>
                        <td>
                          <Link to={`/properties/${property.id}`}>
                            {property.name}
                          </Link>
                        </td>
                        <td>{property.property_type}</td>
                        <td>{property.location}</td>
                        <td>${property.rent_amount?.toLocaleString()}</td>
                        <td>{property.owner?.username || 'Unknown'}</td>
                        <td>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteProperty(property.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>No properties in the system</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agreements Tab */}
      {activeTab === 'agreements' && (
        <div className="card">
          <div className="card-body">
            <h3 className="card-title mb-3">All Rental Agreements</h3>
            {agreements.length > 0 ? (
              <div className="table-container" style={{ boxShadow: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Property</th>
                      <th>Tenant</th>
                      <th>Rent</th>
                      <th>Period</th>
                      <th>Status</th>
                      <th>Verified</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agreements.map(agreement => (
                      <tr key={agreement.id}>
                        <td>{agreement.id}</td>
                        <td>
                          <Link to={`/properties/${agreement.property?.id}`}>
                            {agreement.property?.name || 'Unknown'}
                          </Link>
                        </td>
                        <td>{agreement.tenant?.username || 'Unknown'}</td>
                        <td>${agreement.rent_amount?.toLocaleString()}/mo</td>
                        <td>
                          {new Date(agreement.lease_start_date).toLocaleDateString()} - 
                          {agreement.lease_end_date ? new Date(agreement.lease_end_date).toLocaleDateString() : 'Ongoing'}
                        </td>
                        <td>
                          <span className={`badge ${
                            agreement.status === 'active' ? 'badge-success' :
                            agreement.status === 'pending' ? 'badge-warning' :
                            'badge-danger'
                          }`}>
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
                          <div className="flex gap-1">
                            {!agreement.verified && (
                              <button 
                                className="btn btn-success btn-sm"
                                onClick={() => handleVerifyAgreement(agreement.id, true)}
                              >
                                Verify
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>No rental agreements in the system</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;