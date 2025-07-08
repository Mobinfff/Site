import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// --- Constants ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1';
const ACCESS_TOKEN_KEY = 'fitclub_access_token';
const REFRESH_TOKEN_KEY = 'fitclub_refresh_token';

// --- Helper Functions for Token Management ---
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setAccessToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const removeTokens = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// --- Axios Instance Creation ---
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Axios Request Interceptor ---
// Automatically Aadds Access Token to requests if available
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Axios Response Interceptor ---
// Handles token refresh mécanisme
// This is a simplified refresh logic. A more robust solution would handle concurrent requests
// and prevent multiple refresh calls. Libraries like `axios-auth-refresh` can help.
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (error?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            if (originalRequest.headers) originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        console.error('No refresh token available for token refresh.');
        removeTokens(); // Clear tokens if refresh fails
        // window.location.href = '/login'; // Or trigger logout event
        processQueue(error, null);
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh`, {
          refresh_token: refreshToken,
        });
        const newAccessToken = data.access_token;
        setAccessToken(newAccessToken);
        if (originalRequest.headers) originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError: any) {
        console.error('Token refresh failed:', refreshError.response?.data || refreshError.message);
        removeTokens();
        // window.location.href = '/login'; // Or trigger logout event
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// --- Specific API Service Functions (can be in separate files like authService.ts, clubService.ts) ---

// Example Auth Service functions
export const requestOtpApi = async (phoneNumber: string) => {
  return api.post('/auth/otp/request', { phone_number: phoneNumber });
};

export const verifyOtpApi = async (phoneNumber: string, code: string) => {
  // This response will include user data and tokens
  return api.post('/auth/otp/verify', { phone_number: phoneNumber, code: code });
};

// Example User Service function
export const getMyProfileApi = async () => {
  return api.get('/users/me');
};

// Add other service functions as needed...
// e.g., getClubs, getClubDetails, createBooking, etc.
