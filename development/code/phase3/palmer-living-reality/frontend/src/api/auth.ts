import api from './index';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    access_token: string;
  };
}

export const authApi = {
  login: (data: LoginData): Promise<AuthResponse> =>
    api.post('/auth/login', data),

  register: (data: RegisterData): Promise<AuthResponse> =>
    api.post('/auth/register', data),

  forgotPassword: (email: string): Promise<{ success: boolean; message: string }> =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string): Promise<{ success: boolean; message: string }> =>
    api.post('/auth/reset-password', { token, password }),

  getProfile: (): Promise<{ success: boolean; data: User }> =>
    api.get('/auth/profile'),

  updateProfile: (data: Partial<User>): Promise<{ success: boolean; data: User }> =>
    api.put('/auth/profile', data),
};
