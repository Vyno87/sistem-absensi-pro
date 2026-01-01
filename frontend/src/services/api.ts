import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
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

// Add a response interceptor for auto-logout on 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Session expired or login from another device
            localStorage.removeItem('token');

            // Check if it's specifically the admin online elsewhere error
            const errorCode = error.response?.data?.code;
            if (errorCode === 'ADMIN_ONLINE_ELSEWHERE') {
                // Show alert before redirecting
                alert('Akun Admin Sedang Online di perangkat lain. Anda akan dialihkan ke halaman login.');
            }

            // Redirect to login page
            if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
