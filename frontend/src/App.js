import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from "./pages/Dashboard";
import Groups from "./pages/Groups";
import Students from "./pages/Students";
import Course from "./pages/Course";
import MyCourses from "./pages/MyCourses";
import Homeworks from "./pages/Homeworks";

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return (
        <div style={{ color: '#fff', textAlign: 'center', marginTop: '100px' }}>
            Chargement...
        </div>
    );
    if (!user) return <Navigate to="/login" />;
    return <Layout>{children}</Layout>;
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
                <PrivateRoute>
                    <Dashboard />
                </PrivateRoute>
            } />
            <Route path="/students" element={
                <PrivateRoute>
                    <Students />
                </PrivateRoute>
            } />
            <Route path="/groups" element={
                <PrivateRoute>
                    <Groups />
                </PrivateRoute>
            } />
            <Route path="/course" element={
                <PrivateRoute>
                    <Course />
                </PrivateRoute>
            } />
            <Route path="/my-courses" element={
                <PrivateRoute>
                    <MyCourses />
                </PrivateRoute>
            } />
            <Route path="/homeworks" element={
                <PrivateRoute>
                    <Homeworks />
                </PrivateRoute>
            } />
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;