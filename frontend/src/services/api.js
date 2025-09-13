import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // retrieve JWT from localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // set Authorization header
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
