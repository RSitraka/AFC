import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import FifaCard from '../components/FifaCard.jsx';
import { MAIN_POSITIONS, DETAILED_POSITIONS } from '../data/football.js';

export default function Roster() {
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState('');
  const [main, setMain] = useState('');
  const [pos, setPos] = useState('');
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/players').then(setPlayers).catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (main && p.mainPosition !== main) return false;
      if (pos && !(p.positions || []).includes(pos)) return false;
      if (q && !`${p.firstName} ${p.lastName}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [players, main, pos, q]);

  return (
    <div>
      <h1 className="page-title">Effectif</h1>
      {error && <div className="error">{error}</div>}

      <div className="card toolbar">
        <input style={{ maxWidth: 220 }} placeholder="🔍 Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select style={{ maxWidth: 180 }} value={main} onChange={(e) => setMain(e.target.value)}>
          <option value="">Tous les postes</option>
          {MAIN_POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select style={{ maxWidth: 220 }} value={pos} onChange={(e) => setPos(e.target.value)}>
          <option value="">Tous les postes détaillés</option>
          {DETAILED_POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.value}</option>)}
        </select>
        <span className="muted">{filtered.length} joueur(s)</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">Aucun joueur ne correspond aux filtres.</div>
      ) : (
        <div className="grid auto" style={{ justifyItems: 'center' }}>
          {filtered.map((p) => (
            <FifaCard key={p.id} player={p} onClick={() => navigate(`/joueur/${p.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
