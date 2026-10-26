import axios from 'axios';
import { loginPathFor, lastSpace } from '../utils/audience';

// Create React App utilise process.env au lieu de import.meta.env
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

// Ajouter le token JWT automatiquement
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Session expirée : on renvoie vers la page de connexion
api.interceptors.response.use(
    (res) => res,
    (error) => {
        const url = error.config?.url || '';
        if (error.response?.status === 401 && !url.includes('/auth/login') && localStorage.getItem('token')) {
            localStorage.removeItem('token');
            if (!window.location.pathname.startsWith('/login')) window.location.assign(loginPathFor(lastSpace()));
        }
        return Promise.reject(error);
    }
);

export default api;
