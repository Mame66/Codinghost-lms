import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, homePathFor } from '../../contexts/AuthContext';
import { loginPathFor } from '../../utils/audience';

// Logique commune aux 3 écrans de connexion
export default function useSpaceLogin(espace) {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [loginVal, setLoginVal] = useState(location.state?.login || '');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [wrongSpace, setWrongSpace] = useState(null); // { espace, message }
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setWrongSpace(null);
        setLoading(true);
        try {
            const user = await login(loginVal.trim(), password, espace);
            const from = location.state?.from;
            navigate(from && from !== '/login' ? from : homePathFor(user), { replace: true });
        } catch (err) {
            const data = err.response?.data;
            if (data?.code === 'WRONG_SPACE') {
                setWrongSpace({ espace: data.espace, message: data.message });
            } else if (!err.response) {
                setError('Impossible de joindre le serveur. Vérifiez votre connexion internet.');
            } else {
                setError(data?.message || 'Login ou mot de passe incorrect');
            }
        }
        setLoading(false);
    };

    const goToRightSpace = () =>
        navigate(loginPathFor(wrongSpace?.espace), { state: { login: loginVal } });

    return {
        loginVal, setLoginVal, password, setPassword, showPass, setShowPass,
        error, wrongSpace, loading, submit, goToRightSpace,
    };
}
