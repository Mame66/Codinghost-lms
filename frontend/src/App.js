import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { AuthProvider, useAuth, homePathFor } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginLanding from './pages/login/LoginLanding';
import LoginKids from './pages/login/LoginKids';
import LoginAdults from './pages/login/LoginAdults';
import LoginTeam from './pages/login/LoginTeam';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import GroupDetail from './pages/Groupdetail';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Course from './pages/Course';
import MyCourses from './pages/MyCourses';
import Homeworks from './pages/Homeworks';
import Emails from './pages/Emails';
import MyGrades from './pages/MyGrades';
import Attendance from './pages/Attendance';
import Payments from './pages/Payments';
import Settings from './pages/Settings';
import Billing from './pages/Billing';
import { audienceFromSlug } from './utils/audience';

const STAFF = ['ADMIN', 'TEACHER', 'TEACHER_VIEW'];
const ADMIN = ['ADMIN'];
const STUDENT = ['STUDENT'];

const Loading = () => (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontFamily: "'Plus Jakarta Sans',sans-serif", background: '#F5F4FC' }}>
        Chargement...
    </div>
);

// Route protégée : connecté + rôle autorisé
const PrivateRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) return <Loading />;
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    if (roles && !roles.includes(user.role)) return <Navigate to={homePathFor(user)} replace />;
    return <Layout>{children}</Layout>;
};

// /courses/enfants, /courses/adultes, /students/enfants, /students/adultes
const AudiencePage = ({ Component }) => {
    const { audience } = useParams();
    if (!['enfants', 'adultes'].includes(audience)) return <Navigate to="/dashboard" replace />;
    const key = audienceFromSlug(audience);
    return <Component key={key} audience={key} />;
};

const FallbackRedirect = () => {
    const { user, loading } = useAuth();
    if (loading) return <Loading />;
    return <Navigate to={user ? homePathFor(user) : '/login'} replace />;
};

function AppRoutes() {
    return (
        <Routes>
            {/* Connexion */}
            <Route path="/login" element={<LoginLanding />} />
            <Route path="/login/enfants" element={<LoginKids />} />
            <Route path="/login/adultes" element={<LoginAdults />} />
            <Route path="/login/equipe" element={<LoginTeam />} />

            {/* Équipe pédagogique */}
            <Route path="/dashboard" element={<PrivateRoute roles={STAFF}><Dashboard /></PrivateRoute>} />
            <Route path="/groups" element={<PrivateRoute roles={STAFF}><Groups /></PrivateRoute>} />
            <Route path="/groups/:id" element={<PrivateRoute roles={STAFF}><GroupDetail /></PrivateRoute>} />
            <Route path="/courses/:audience" element={<PrivateRoute roles={STAFF}><AudiencePage Component={MyCourses} /></PrivateRoute>} />
            <Route path="/students/:audience" element={<PrivateRoute roles={STAFF}><AudiencePage Component={Students} /></PrivateRoute>} />
            <Route path="/attendance" element={<PrivateRoute roles={STAFF}><Attendance /></PrivateRoute>} />
            <Route path="/homeworks" element={<PrivateRoute roles={STAFF}><Homeworks /></PrivateRoute>} />
            <Route path="/emails" element={<PrivateRoute roles={['ADMIN', 'TEACHER']}><Emails /></PrivateRoute>} />

            {/* Administration */}
            <Route path="/teachers" element={<PrivateRoute roles={ADMIN}><Teachers /></PrivateRoute>} />
            <Route path="/payments" element={<PrivateRoute roles={ADMIN}><Payments /></PrivateRoute>} />
            <Route path="/billing" element={<PrivateRoute roles={ADMIN}><Billing /></PrivateRoute>} />

            {/* Élèves */}
            <Route path="/course" element={<PrivateRoute roles={STUDENT}><Course /></PrivateRoute>} />
            <Route path="/my-grades" element={<PrivateRoute roles={STUDENT}><MyGrades /></PrivateRoute>} />

            {/* Tous */}
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

            {/* Anciennes adresses */}
            <Route path="/my-courses" element={<Navigate to="/courses/enfants" replace />} />
            <Route path="/students" element={<Navigate to="/students/enfants" replace />} />
            <Route path="/my-homeworks" element={<Navigate to="/my-grades" replace />} />

            <Route path="*" element={<FallbackRedirect />} />
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
