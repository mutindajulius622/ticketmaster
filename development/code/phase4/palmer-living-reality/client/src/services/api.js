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
  delete: (id) => api.delete(`/properties/${id}`)
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

export default api;

