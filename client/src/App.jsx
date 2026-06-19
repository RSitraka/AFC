import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ProfileSetup from './pages/ProfileSetup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Roster from './pages/Roster.jsx';
import PlayerDetail from './pages/PlayerDetail.jsx';
import Formations from './pages/Formations.jsx';
import Tactics from './pages/Tactics.jsx';
import ClubStaff from './pages/ClubStaff.jsx';
import MatchCreate from './pages/MatchCreate.jsx';
import Finances from './pages/Finances.jsx';
import Dues from './pages/Dues.jsx';
import Approvals from './pages/Approvals.jsx';
import Profile from './pages/Profile.jsx';

function Loader() {
  return (
    <div className="pitch-bg center-screen">
      <div className="spinner" />
    </div>
  );
}

function Protected({ children, staffOnly }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  // Profil obligatoire à la première connexion.
  if (!user.profileCompleted && location.pathname !== '/profil/setup') {
    return <Navigate to="/profil/setup" replace />;
  }
  if (staffOnly && user.role !== 'STAFF') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

      <Route
        path="/profil/setup"
        element={
          <Protected>
            <div className="pitch-bg"><div className="container"><ProfileSetup /></div></div>
          </Protected>
        }
      />

      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="effectif" element={<Roster />} />
        <Route path="joueur/:id" element={<PlayerDetail />} />
        <Route path="formations" element={<Formations />} />
        <Route path="tactique" element={<Tactics />} />
        <Route path="club" element={<ClubStaff />} />
        <Route path="match/nouveau" element={<Protected staffOnly><MatchCreate /></Protected>} />
        <Route path="profil" element={<Profile />} />
        <Route path="finances" element={<Finances />} />
        <Route path="cotisations" element={<Dues />} />
        <Route path="validations" element={<Protected staffOnly><Approvals /></Protected>} />
      </Route>

      <Route path="*" element={loading ? <Loader /> : <Navigate to="/" replace />} />
    </Routes>
  );
}
