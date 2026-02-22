import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { propertyService, rentalService } from '../services/api';
import PropertyCard from '../components/PropertyCard';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [activeTab, setActiveTab] = useState('properties');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propertiesRes, agreementsRes] = await Promise.all([
          propertyService.getAll(),
          rentalService.getAll()
        ]);
        
        const myProperties = propertiesRes.data.filter(p => p.owner_id === user?.id);
        setProperties(myProperties);
        
        // Get agreements for owner's properties
        const myAgreements = agreementsRes.data.filter(a => 
          myProperties.some(p => p.id === a.property_id)
        );
        setAgreements(myAgreements);
      } catch {
        // Silently handle error - page will show empty state
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await propertyService.delete(id);
        setProperties(properties.filter(p => p.id !== id));
      } catch (error) {
        alert('Failed to delete property');
      }
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (editingProperty) {
        const response = await propertyService.update(editingProperty.id, values);
        setProperties(properties.map(p => 
          p.id === editingProperty.id ? response.data : p
        ));
      } else {
        const response = await propertyService.create(values);
        setProperties([...properties, response.data]);
      }
      setShowAddModal(false);
      setEditingProperty(null);
      resetForm();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save property');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (property) => {
    setEditingProperty(property);
    setShowAddModal(true);
  };

  // Calculate stats
  const totalRent = properties.reduce((sum, p) => sum + (p.rent_amount || 0), 0);
  const forRent = properties.filter(p => p.is_for_rent).length;
  const forSale = properties.filter(p => p.is_for_sale).length;
  const pendingApplications = agreements.filter(a => a.status === 'pending').length;

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 'calc(var(--navbar-height) + 2rem)' }}>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'calc(var(--navbar-height) + 2rem)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1 className="page-title">Owner Dashboard</h1>
            <p className="page-subtitle">Manage your real estate portfolio</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setEditingProperty(null);
              setShowAddModal(true);
            }}
          >
            ➕ Add New Property
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">🏠</div>
          <div className="stat-value">{properties.length}</div>
          <div className="stat-label">Total Properties</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-success">💰</div>
          <div className="stat-value">${totalRent.toLocaleString()}</div>
          <div className="stat-label">Total Monthly Rent</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--secondary-100)', color: 'var(--secondary-600)' }}>🏢</div>
          <div className="stat-value">{forRent}</div>
          <div className="stat-label">For Rent</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-100)', color: 'var(--accent-600)' }}>⏳</div>
          <div className="stat-value">{pendingApplications}</div>
          <div className="stat-label">Pending Applications</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0' }}>
          {[
            { id: 'properties', label: 'My Properties', icon: '🏠' },
            { id: 'applications', label: 'Applications', icon: '📋' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '1rem 2rem',
                border: 'none',
                background: activeTab === tab.id ? 'var(--primary-600)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {tab.icon} {tab.label}
              {tab.id === 'applications' && pendingApplications > 0 && (
                <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>
                  {pendingApplications}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Properties Tab */}
      {activeTab === 'properties' && (
        <>
          {properties.length > 0 ? (
            <div className="property-grid">
              {properties.map(property => (
                <div key={property.id} style={{ position: 'relative' }}>
                  <PropertyCard property={property} />
                  <div className="flex gap-1 mt-2" style={{ padding: '0 1.5rem 1.5rem' }}>
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => openEditModal(property)}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(property.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🏢</div>
              <h3 className="empty-state-title">No properties yet</h3>
              <p className="empty-state-text">Add your first property to start renting it out</p>
              <button 
                className="btn btn-primary mt-3"
                onClick={() => setShowAddModal(true)}
              >
                Add Property
              </button>
            </div>
          )}
        </>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="card">
          <div className="card-body">
            <h3 className="card-title mb-3">Rental Applications</h3>
            {agreements.length > 0 ? (
              <div className="table-container" style={{ boxShadow: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Tenant</th>
                      <th>Rent</th>
                      <th>Start Date</th>
                      <th>Status</th>
                      <th>Verified</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agreements.map(agreement => (
                      <tr key={agreement.id}>
                        <td>
                          <Link to={`/properties/${agreement.property_id}`}>
                            {agreement.property?.name || 'Unknown'}
                          </Link>
                        </td>
                        <td>{agreement.tenant?.username || 'Unknown'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                          ${agreement.rent_amount?.toLocaleString()}/mo
                        </td>
                        <td>{new Date(agreement.lease_start_date).toLocaleDateString()}</td>
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
                          <Link 
                            to={`/properties/${agreement.property_id}`}
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
                <h3 className="empty-state-title">No applications yet</h3>
                <p className="empty-state-text">Rental applications will appear here when tenants apply</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Property Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => {
          setShowAddModal(false);
          setEditingProperty(null);
        }}>
          <div className="modal" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingProperty ? '✏️ Edit Property' : '➕ Add New Property'}
              </h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProperty(null);
                }}
              >
                ×
              </button>
            </div>

            <Formik
              initialValues={{
                name: editingProperty?.name || '',
                property_type: editingProperty?.property_type || 'apartment',
                description: editingProperty?.description || '',
                location: editingProperty?.location || '',
                address: editingProperty?.address || '',
                rent_amount: editingProperty?.rent_amount || '',
                sale_price: editingProperty?.sale_price || '',
                is_for_rent: editingProperty?.is_for_rent ?? true,
                is_for_sale: editingProperty?.is_for_sale ?? false,
                bedrooms: editingProperty?.bedrooms || 0,
                bathrooms: editingProperty?.bathrooms || 0,
                square_feet: editingProperty?.square_feet || '',
                image_url: editingProperty?.image_url || ''
              }}
              validationSchema={Yup.object({
                name: Yup.string()
                  .min(3, 'Name must be at least 3 characters')
                  .required('Property name is required'),
                property_type: Yup.string()
                  .oneOf(['apartment', 'mansion', 'bungalow'])
                  .required('Property type is required'),
                location: Yup.string()
                  .required('Location is required'),
                rent_amount: Yup.number()
                  .min(0, 'Rent amount cannot be negative')
                  .required('Rent amount is required')
              })}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">🏠 Property Name *</label>
                      <Field type="text" name="name" className="form-input" placeholder="e.g., Sunset Apartments" />
                      <ErrorMessage name="name" component="div" className="form-error" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">🏢 Property Type *</label>
                      <Field as="select" name="property_type" className="form-select">
                        <option value="apartment">🏢 Apartment</option>
                        <option value="mansion">🏰 Mansion</option>
                        <option value="bungalow">🏡 Bungalow</option>
                      </Field>
                      <ErrorMessage name="property_type" component="div" className="form-error" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">📍 Location *</label>
                      <Field type="text" name="location" className="form-input" placeholder="City, Area" />
                      <ErrorMessage name="location" component="div" className="form-error" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">🏠 Address</label>
                      <Field type="text" name="address" className="form-input" placeholder="Full address" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">💰 Monthly Rent ($) *</label>
                        <Field type="number" name="rent_amount" className="form-input" placeholder="1500" />
                        <ErrorMessage name="rent_amount" component="div" className="form-error" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">💵 Sale Price ($)</label>
                        <Field type="number" name="sale_price" className="form-input" placeholder="250000" />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">🛏️ Bedrooms</label>
                        <Field type="number" name="bedrooms" className="form-input" min="0" placeholder="2" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">🚿 Bathrooms</label>
                        <Field type="number" name="bathrooms" className="form-input" min="0" step="0.5" placeholder="1.5" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">📐 Square Feet</label>
                        <Field type="number" name="square_feet" className="form-input" min="0" placeholder="1200" />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">📝 Description</label>
                      <Field as="textarea" name="description" className="form-textarea" placeholder="Describe your property..." rows={4} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">🖼️ Image URL</label>
                      <Field type="url" name="image_url" className="form-input" placeholder="https://..." />
                    </div>

                    <div className="form-group">
                      <label className="form-label">📋 Listing Type</label>
                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <Field type="checkbox" name="is_for_rent" />
                          <span>🏠 For Rent</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <Field type="checkbox" name="is_for_sale" />
                          <span>💵 For Sale</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button 
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingProperty(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : (editingProperty ? 'Update Property' : 'Add Property')}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;