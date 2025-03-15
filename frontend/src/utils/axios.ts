import axios from 'axios';
import { AuthService } from '@/services/auth.service';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for API calls
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        const authService = AuthService.getInstance();
        const refreshed = await authService.refreshToken();

        if (refreshed) {
          // Retry the original request
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear auth state and redirect to login
        AuthService.getInstance().clearAuthState();
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance; 