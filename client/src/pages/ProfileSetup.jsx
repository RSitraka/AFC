import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ProfileForm from '../components/ProfileForm.jsx';

// Première connexion : le joueur crée son profil et ses notes.
export default function ProfileSetup() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();

  const submit = async (data) => {
    await api.put('/auth/profile', data);
    await refresh();
    navigate('/');
  };

  return (
    <div style={{ paddingTop: '1rem' }}>
      <h1 className="page-title">Bienvenue ! Complétez votre profil</h1>
      <p style={{ color: '#fff' }}>Renseignez vos postes et vos notes pour générer votre carte FIFA.</p>
      <ProfileForm initial={user} onSubmit={submit} submitLabel="Valider mon profil" />
    </div>
  );
}
