// src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add a request interceptor to attach the JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // retrieve JWT from localStorage
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`; // set Authorization header
    }

    // Only set JSON content-type for plain objects (not FormData).
    // If config.data is FormData, browser will set the proper multipart Content-Type with boundary.
    if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
      config.headers = config.headers || {};
      config.headers['Content-Type'] = 'application/json';
    } else {
      // ensure we don't accidentally carry over a previous default header
      if (config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
