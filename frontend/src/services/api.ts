// API Service für Backend-Kommunikation
import axios from 'axios';
import type { ApiResponse, User, DashboardData } from '../types/user';

// Backend URL Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Axios Instance mit Defaults
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Wichtig für Sessions/Cookies
  timeout: 10000,
});

// Response Interceptor für Error Handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    // Redirect bei 401 Unauthorized
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// AUTH API CALLS
export const authAPI = {
  // Login Redirect (wird vom Backend gehandelt)
  login: () => {
    window.location.href = `${API_BASE_URL}/auth/login`;
  },

  // Logout
  logout: async (): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};

// USER API CALLS
export const userAPI = {
  // User Profile abrufen
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get('/api/user/profile');
    return response.data;
  },

  // User Profile aktualisieren
  updateProfile: async (updates: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await apiClient.put('/api/user/profile', updates);
    return response.data;
  },

  // Dashboard Data abrufen
  getDashboard: async (): Promise<ApiResponse<DashboardData>> => {
    const response = await apiClient.get('/api/user/dashboard');
    return response.data;
  },

  // Premium Content (Admin only)
  getPremium: async (): Promise<ApiResponse> => {
    const response = await apiClient.get('/api/user/premium');
    return response.data;
  },

  // All Users abrufen (Admin only)
  getAllUsers: async (): Promise<ApiResponse<{ users: User[]; count: number }>> => {
    const response = await apiClient.get('/api/user/all');
    return response.data;
  },
};

// HEALTH CHECK
export const healthAPI = {
  check: async (): Promise<{ status: string; message: string; timestamp: string }> => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

export default apiClient; 