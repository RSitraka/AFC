import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ProfileForm from '../components/ProfileForm.jsx';
import FifaCard from '../components/FifaCard.jsx';

export default function Profile() {
  const { user, refresh } = useAuth();
  const [me, setMe] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/auth/me').then(setMe);
  }, []);

  const submit = async (data) => {
    const updated = await api.put('/auth/profile', data);
    setMe((m) => ({ ...m, ...updated, stats: updated.stats }));
    setSaved(true);
    await refresh();
    setTimeout(() => setSaved(false), 2500);
  };

  if (!me) return <div className="center-screen"><div className="spinner" /></div>;

  return (
    <div>
      <h1 className="page-title">Mon profil</h1>
      {saved && <div className="success">Profil mis à jour ✅</div>}
      <div className="grid" style={{ gridTemplateColumns: '230px 1fr', alignItems: 'start' }}>
        <div className="card" style={{ display: 'grid', placeItems: 'center' }}>
          <FifaCard player={me} />
          <p className="muted" style={{ textAlign: 'center' }}>
            {user.role === 'STAFF' ? '⭐ Compte staff' : 'Joueur'}
          </p>
        </div>
        <ProfileForm initial={me} onSubmit={submit} submitLabel="Mettre à jour" />
      </div>
    </div>
  );
}
