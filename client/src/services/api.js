import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT bearer token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('imovies_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If sending FormData, delete Content-Type so the browser/Axios assigns multipart/form-data with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize error extraction and handle expired tokens
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data;
    let message =
      errorData?.message ||
      error.message ||
      'An unexpected network error occurred';

    if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
      const details = errorData.errors
        .map((e) => e.message || `${e.field || e.param}: invalid`)
        .filter(Boolean)
        .join(', ');
      if (details && !message.includes(details)) {
        message = `${message}: ${details}`;
      }
    }

    // If 401 Unauthorized occurs on protected routes (excluding login/register), clear stale token
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes('/login') &&
      !window.location.pathname.includes('/register')
    ) {
      localStorage.removeItem('imovies_token');
      localStorage.removeItem('imovies_user');
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
