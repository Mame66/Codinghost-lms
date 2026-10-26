import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { rememberSpace } from '../utils/audience';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    }, []);

    useEffect(() => {
        let cancelled = false;
        const fetchUser = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const res = await api.get('/auth/me');
                if (!cancelled) setUser(res.data);
            } catch {
                if (!cancelled) logout();
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchUser();
        return () => { cancelled = true; };
    }, [token, logout]);

    // espace : 'ENFANT' | 'ADULTE' | 'EQUIPE'
    // En cas de mauvais espace, l'erreur contient err.response.data.code === 'WRONG_SPACE'
    const login = async (loginVal, password, espace) => {
        const res = await api.post('/auth/login', { login: loginVal, password, espace });
        localStorage.setItem('token', res.data.token);
        rememberSpace(res.data.user.role === 'STUDENT' ? (res.data.user.audience || espace) : 'EQUIPE');
        setUser(res.data.user);
        setToken(res.data.token);
        return res.data.user;
    };

    // Mise à jour locale (ex : nouvelle photo de profil)
    const updateUser = (patch) => setUser(u => (u ? { ...u, ...patch } : u));

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export const homePathFor = (user) => (user?.role === 'STUDENT' ? '/course' : '/dashboard');
