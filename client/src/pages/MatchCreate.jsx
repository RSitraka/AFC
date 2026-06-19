import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import LineupBoard, { boardToPositions, positionsToBoard } from '../components/LineupBoard.jsx';

const todayLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const defaultBoard = { format: 11, formation: '4-3-3', assignments: {}, subs: [] };

export default function MatchCreate() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [lineups, setLineups] = useState([]);
  const [board, setBoard] = useState(defaultBoard);
  const [form, setForm] = useState({ opponent: '', date: todayLocal(), location: '', scoreFor: '', scoreAgainst: '' });
  const [scorers, setScorers] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/players').then(setPlayers);
    api.get('/lineups').then(setLineups);
  }, []);

  // Joueurs convoqués (titulaires placés + remplaçants) → participants.
  const participants = useMemo(
    () => boardToPositions(board)
      .filter((p) => p.playerId)
      .map((p) => ({ playerId: p.playerId, role: p.role, positionLabel: p.positionLabel, x: p.x, y: p.y })),
    [board],
  );
  const calledUp = participants.map((p) => p.playerId);
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));

  const loadLineup = (id) => {
    const l = lineups.find((x) => x.id === id);
    if (l) setBoard(positionsToBoard(l.format, l.formation, l.positions));
  };

  const toggleScorer = (pid) =>
    setScorers((s) => (s.includes(pid) ? s.filter((x) => x !== pid) : [...s, pid]));

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (participants.length === 0) { setMessage('Sélectionnez au moins un joueur sur le terrain.'); return; }
    setBusy(true);
    try {
      const payload = {
        opponent: form.opponent,
        date: form.date,
        location: form.location || null,
        format: board.format,
        formation: board.formation,
        scoreFor: form.scoreFor === '' ? null : Number(form.scoreFor),
        scoreAgainst: form.scoreAgainst === '' ? null : Number(form.scoreAgainst),
        scorerIds: scorers,
        participants,
      };
      await api.post('/matches', payload);
      navigate('/club');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <h1 className="page-title">Ajouter un match</h1>
      {message && <div className="error">{message}</div>}

      <div className="card">
        <div className="grid cols-3">
          <div className="field">
            <label>Adversaire</label>
            <input value={form.opponent} required onChange={(e) => setForm({ ...form, opponent: e.target.value })} />
          </div>
          <div className="field">
            <label>Date &amp; heure</label>
            <input type="datetime-local" value={form.date} required onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="field">
            <label>Lieu</label>
            <input value={form.location} placeholder="Stade…" onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
        </div>
        <div className="row">
          <div className="field" style={{ flex: 1 }}>
            <label>Charger une composition enregistrée</label>
            <select defaultValue="" onChange={(e) => e.target.value && loadLineup(e.target.value)}>
              <option value="">— Aucune (composer manuellement) —</option>
              {lineups.map((l) => <option key={l.id} value={l.id}>{l.name} (à {l.format} · {l.formation})</option>)}
            </select>
          </div>
          <div className="field" style={{ width: 120 }}>
            <label>Score pour</label>
            <input type="number" min="0" value={form.scoreFor} placeholder="—" onChange={(e) => setForm({ ...form, scoreFor: e.target.value })} />
          </div>
          <div className="field" style={{ width: 120 }}>
            <label>Score contre</label>
            <input type="number" min="0" value={form.scoreAgainst} placeholder="—" onChange={(e) => setForm({ ...form, scoreAgainst: e.target.value })} />
          </div>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Laissez les scores vides pour un match à venir. Les joueurs placés + remplaçants seront comptés comme « ayant joué ».
        </p>
      </div>

      <h2 className="page-title" style={{ marginTop: '1rem' }}>Composition du match</h2>
      <LineupBoard players={players} board={board} onChange={setBoard} />

      {calledUp.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3>⚽ Buteurs (optionnel)</h3>
          <div className="pill-select">
            {calledUp.map((pid) => byId[pid] && (
              <button type="button" key={pid}
                className={`pill ${scorers.includes(pid) ? 'active' : ''}`}
                onClick={() => toggleScorer(pid)}>
                {byId[pid].lastName} {scorers.includes(pid) ? '⚽' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card toolbar" style={{ marginTop: '1rem' }}>
        <button className="btn" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer le match'}</button>
        <button type="button" className="btn secondary" onClick={() => navigate('/club')}>Annuler</button>
        <span className="badge gold">{participants.length} joueur(s) convoqué(s)</span>
      </div>
    </form>
  );
}
