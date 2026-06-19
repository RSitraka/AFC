import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import FifaCard from '../components/FifaCard.jsx';
import PasswordChangeForm from '../components/PasswordChangeForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { STAT_FIELDS, positionLabel, overallRating } from '../data/football.js';

export default function PlayerDetail() {
  const { id } = useParams();
  const { isStaff, user } = useAuth();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [error, setError] = useState('');

  const setRole = async (role) => {
    const updated = await api.post(`/players/${id}/role`, { role });
    setPlayer((p) => ({ ...p, role: updated.role }));
  };
  const removePlayer = async () => {
    if (!window.confirm('Supprimer définitivement ce joueur et toutes ses données ?')) return;
    await api.del(`/players/${id}`);
    navigate('/effectif');
  };

  useEffect(() => {
    api.get(`/players/${id}`).then(setPlayer).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="error">{error}</div>;
  if (!player) return <div className="center-screen"><div className="spinner" /></div>;

  const stats = player.stats || {};

  return (
    <div>
      <Link to="/effectif" className="btn sm secondary">← Retour à l'effectif</Link>
      <h1 className="page-title" style={{ marginTop: '0.6rem' }}>{player.firstName} {player.lastName}</h1>

      <div className="side-grid">
        <div className="card" style={{ display: 'grid', placeItems: 'center' }}>
          <FifaCard player={player} />
        </div>

        <div className="card">
          <h3>Fiche</h3>
          <div className="grid cols-2">
            <div><span className="muted">Numéro</span><br />#{player.number ?? '--'}{player.secondaryNumber != null ? ` / #${player.secondaryNumber}` : ''}</div>
            <div><span className="muted">Poste principal</span><br /><span className="badge">{player.mainPosition}</span></div>
            <div><span className="muted">Pied fort</span><br />{player.strongFoot}</div>
            <div><span className="muted">Matchs joués</span><br /><b className="stat-big" style={{ fontSize: '1.6rem' }}>{player.matchesPlayed ?? 0}</b></div>
            <div><span className="muted">Note globale</span><br /><b className="stat-big" style={{ fontSize: '1.6rem' }}>{overallRating(stats)}</b></div>
          </div>
          <div style={{ marginTop: '0.8rem' }}>
            <span className="muted">Postes</span><br />
            <div className="pill-select" style={{ marginTop: '0.3rem' }}>
              {(player.positions || []).map((p) => <span key={p} className="pill active" title={positionLabel(p)}>{p}</span>)}
              {(player.positions || []).length === 0 && <span className="muted">—</span>}
            </div>
          </div>

          <h3 style={{ marginTop: '1rem' }}>Notes détaillées</h3>
          <div className="grid cols-2">
            {STAT_FIELDS.map((f) => (
              <div className="spread" key={f.key} style={{ borderBottom: '1px solid var(--border)', padding: '0.25rem 0' }}>
                <span>{f.label}{f.isRisk ? ' ⚠️' : ''}</span>
                <b>{stats[f.key] ?? '-'}/10</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isStaff && user?.id !== player.id && (
        <div className="grid cols-2" style={{ marginTop: '1rem' }}>
          <div className="card">
            <h3>⚙️ Gestion du compte</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              Rôle actuel : <span className="badge gold">{player.role === 'STAFF' ? 'Staff' : 'Joueur simple'}</span>
            </p>
            <div className="row">
              {player.role === 'STAFF' ? (
                <button className="btn sm secondary" onClick={() => setRole('PLAYER')}>Passer en joueur simple</button>
              ) : (
                <button className="btn sm" onClick={() => setRole('STAFF')}>Passer en staff</button>
              )}
              <button className="btn sm danger" onClick={removePlayer}>Supprimer le joueur</button>
            </div>
          </div>
          <PasswordChangeForm playerId={player.id} requireCurrent={false} title={`Réinitialiser le mot de passe de ${player.firstName}`} />
        </div>
      )}
    </div>
  );
}
