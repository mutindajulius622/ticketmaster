import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/auth';
import { User } from '../api/auth';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        try {
          await authApi.getProfile();
        } catch (error) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.login({ email, password });

      const { user, access_token } = response.data;

      setUser(user);
      setToken(access_token);
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Login successful!');
    } catch (error: any) {
      toast.error(error || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    try {
      setIsLoading(true);
      const response = await authApi.register(data);

      const { user, access_token } = response.data;

      setUser(user);
      setToken(access_token);
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Registration successful!');
    } catch (error: any) {
      toast.error(error || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    window.location.href = '/login';
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      const response = await authApi.updateProfile(data);
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error || 'Failed to update profile');
      throw error;
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
