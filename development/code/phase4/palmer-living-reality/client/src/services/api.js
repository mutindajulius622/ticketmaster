import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear user state on 401
      window.dispatchEvent(new CustomEvent('auth-error'));
    }
    return Promise.reject(error);
  }
);

export const propertyService = {
  getAll: (params = {}) => api.get('/properties', { params }),
  getById: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
  getAmenities: (propertyId) => api.get(`/properties/${propertyId}/amenities`),
  addAmenity: (propertyId, amenityId) => api.post(`/properties/${propertyId}/amenities`, { amenity_id: amenityId }),
  removeAmenity: (propertyId, amenityId) => api.delete(`/properties/${propertyId}/amenities`, { data: { amenity_id: amenityId } })
};

export const amenityService = {
  getAll: () => api.get('/amenities'),
  create: (data) => api.post('/amenities', data)
};

export const userService = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getPendingTenants: () => api.get('/pending-tenants'),
  verifyTenant: (id, isVerified) => api.put(`/verify-tenant/${id}`, { isVerified })
};

export const rentalService = {
  getAll: () => api.get('/rental-agreements'),
  getById: (id) => api.get(`/rental-agreements/${id}`),
  create: (data) => api.post('/rental-agreements', data),
  update: (id, data) => api.put(`/rental-agreements/${id}`, data),
  delete: (id) => api.delete(`/rental-agreements/${id}`)
};

export const paymentService = {
  initiate: (data) => api.post('/payments/initiate', data),
  getStatus: (paymentId) => api.get(`/payments/${paymentId}/status`),
  getAll: () => api.get('/payments')
};

export const inquiryService = {
  create: (data) => api.post('/inquiries', data),
  getAll: () => api.get('/inquiries'),
  getById: (id) => api.get(`/inquiries/${id}`),
  getMyInquiries: () => api.get('/my-inquiries'),
  getPropertyInquiries: (propertyId) => api.get(`/properties/${propertyId}/inquiries`),
  updateStatus: (id, status) => api.put(`/inquiries/${id}`, { status })
};

export default api;
