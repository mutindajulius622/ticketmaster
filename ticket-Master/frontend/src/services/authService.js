import api from './api';

const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  
  register: (userData) =>
    api.post('/auth/register', userData),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
  
  logout: () =>
    api.post('/auth/logout'),
  
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword }),
  
  refreshToken: () =>
    api.post('/auth/refresh'),
};

export default authService;
