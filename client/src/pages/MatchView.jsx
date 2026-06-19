import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import PitchLines from '../components/PitchLines.jsx';

const fmtDateTime = (d) => new Date(d).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
const firstName = (p) => p?.firstName || p?.lastName || '';

function ReadOnlyPitch({ starters }) {
  return (
    <div className="pitch">
      <PitchLines />
      {starters.map((p) => (
        <div key={p.id} className="token" style={{ left: `${p.x}%`, top: `${p.y}%`, cursor: 'default' }}>
          <span className="jersey">
            {p.player?.photoUrl
              ? <img src={p.player.photoUrl} alt="" />
              : (p.player?.number ?? firstName(p.player)[0] ?? '·')}
          </span>
          <span className="tname">{firstName(p.player)}</span>
          <span className="tlabel">{p.positionLabel}</span>
        </div>
      ))}
    </div>
  );
}

export default function MatchView() {
  const { id } = useParams();
  const { isStaff } = useAuth();
  const [match, setMatch] = useState(null);
  const [score, setScore] = useState({ scoreFor: '', scoreAgainst: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => api.get(`/matches/${id}`).then((m) => {
    setMatch(m);
    setScore({ scoreFor: m.scoreFor ?? '', scoreAgainst: m.scoreAgainst ?? '' });
  });
  useEffect(() => { load(); }, [id]);

  if (!match) return <div className="center-screen"><div className="spinner" /></div>;

  const starters = (match.participants || []).filter((p) => p.role === 'STARTER');
  const subs = (match.participants || []).filter((p) => p.role === 'SUBSTITUTE');
  const finished = match.scoreFor != null && match.scoreAgainst != null;

  const saveScore = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg('');
    try {
      await api.put(`/matches/${id}`, {
        opponent: match.opponent,
        date: match.date,
        location: match.location,
        format: match.format,
        formation: match.formation,
        scoreFor: score.scoreFor === '' ? null : Number(score.scoreFor),
        scoreAgainst: score.scoreAgainst === '' ? null : Number(score.scoreAgainst),
      });
      setMsg('Score enregistré ✅');
      load();
    } catch (e2) { setMsg(e2.message); } finally { setBusy(false); }
  };

  return (
    <div>
      <Link to="/club" className="btn sm secondary">← Retour</Link>
      <h1 className="page-title" style={{ marginTop: '0.6rem' }}>
        Nous vs {match.opponent}
      </h1>

      <div className="card">
        <div className="spread">
          <div>
            <div className="muted">{fmtDateTime(match.date)} · {match.location || 'lieu non précisé'}</div>
            <div className="row" style={{ margintop: '0.3rem' }}>
              <span className="badge gold">Foot à {match.format}</span>
              {match.formation && <span className="badge">{match.formation}</span>}
              {finished
                ? <span className="badge green">Terminé</span>
                : <span className="badge red">À venir</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="stat-big">{finished ? `${match.scoreFor} - ${match.scoreAgainst}` : '— : —'}</div>
          </div>
        </div>
      </div>

      <div className="board-grid" style={{ marginTop: '1rem' }}>
        <ReadOnlyPitch starters={starters} />
        <div className="card">
          <h3>Remplaçants ({subs.length})</h3>
          <div className="bench">
            {subs.length === 0 && <span className="muted">Aucun remplaçant.</span>}
            {subs.map((p) => (
              <span key={p.id} className="squad-chip">
                <span className="num">{p.player?.number ?? '–'}</span>{firstName(p.player)}
              </span>
            ))}
          </div>

          {isStaff && (
            <form onSubmit={saveScore} style={{ marginTop: '1rem' }}>
              <h3>{finished ? 'Modifier le score' : 'Saisir le score (match terminé)'}</h3>
              {msg && <div className={msg.includes('✅') ? 'success' : 'error'}>{msg}</div>}
              <div className="row">
                <div className="field" style={{ flex: 1 }}>
                  <label>Nous</label>
                  <input type="number" min="0" value={score.scoreFor} onChange={(e) => setScore({ ...score, scoreFor: e.target.value })} />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>{match.opponent}</label>
                  <input type="number" min="0" value={score.scoreAgainst} onChange={(e) => setScore({ ...score, scoreAgainst: e.target.value })} />
                </div>
              </div>
              <button className="btn" disabled={busy}>{busy ? '…' : 'Enregistrer le score'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
