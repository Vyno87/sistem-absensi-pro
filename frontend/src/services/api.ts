import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://sistem-absensi-pro.vercel.app/api' : 'http://localhost:5000/api'),
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
