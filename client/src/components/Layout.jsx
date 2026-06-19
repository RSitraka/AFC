import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function ThemeToggle() {
  const [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('afc_theme', dark ? 'dark' : 'light');
  }, [dark]);
  return (
    <button className="icon-btn" onClick={() => setDark((d) => !d)} title="Mode sombre">
      {dark ? '☀️' : '🌙'}
    </button>
  );
}

export default function Layout() {
  const { user, team, logout, isStaff } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Couleurs du club appliquées globalement.
  useEffect(() => {
    if (team?.primaryColor) document.documentElement.style.setProperty('--club-primary', team.primaryColor);
    if (team?.secondaryColor) document.documentElement.style.setProperty('--club-secondary', team.secondaryColor);
  }, [team]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const close = () => setOpen(false);

  return (
    <div className="pitch-bg">
      <header className="navbar">
        <div className="brand">
          {team?.logoUrl ? (
            <img src={team.logoUrl} alt="logo" />
          ) : (
            <div className="logo-fallback">⚽</div>
          )}
          {team?.name || 'AFC'}
        </div>

        <button className="burger" onClick={() => setOpen((o) => !o)} aria-label="menu">☰</button>

        <nav className={`nav-links ${open ? 'open' : ''}`} onClick={close}>
          <NavLink to="/" end>Tableau de bord</NavLink>
          <NavLink to="/effectif">Effectif</NavLink>
          <NavLink to="/formations">Formations</NavLink>
          <NavLink to="/tactique">Composition</NavLink>
          <NavLink to="/club">Club &amp; staff</NavLink>
          {isStaff && <NavLink to="/match/nouveau">+ Match</NavLink>}
          <NavLink to="/finances">Compte</NavLink>
          <NavLink to="/cotisations">Cotisations</NavLink>
          {isStaff && <NavLink to="/validations">Validations</NavLink>}
          <NavLink to="/profil">Mon profil</NavLink>
          <ThemeToggle />
          <button className="icon-btn" onClick={handleLogout}>Déconnexion</button>
        </nav>
      </header>

      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
