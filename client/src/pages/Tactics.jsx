import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import LineupBoard, { boardToPositions, positionsToBoard } from '../components/LineupBoard.jsx';

const emptyBoard = { format: 11, formation: '4-3-3', assignments: {}, subs: [] };

export default function Tactics() {
  const { isStaff } = useAuth();
  const [players, setPlayers] = useState([]);
  const [lineups, setLineups] = useState([]);
  const [board, setBoard] = useState(emptyBoard);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const pitchRef = useRef(null);

  useEffect(() => {
    api.get('/players').then(setPlayers);
    api.get('/lineups').then(setLineups);
  }, []);

  const reset = () => { setBoard(emptyBoard); setEditingId(null); setName(''); setMessage(''); };

  const save = async () => {
    setMessage('');
    if (!name.trim()) { setMessage('Donnez un nom à la composition.'); return; }
    const payload = { name: name.trim(), format: board.format, formation: board.formation, positions: boardToPositions(board) };
    try {
      if (editingId) {
        const updated = await api.put(`/lineups/${editingId}`, payload);
        setLineups((l) => l.map((x) => (x.id === editingId ? updated : x)));
      } else {
        const created = await api.post('/lineups', payload);
        setLineups((l) => [created, ...l]);
      }
      setMessage('Composition enregistrée ✅');
    } catch (e) { setMessage(e.message); }
  };

  const load = (lineup) => {
    setBoard(positionsToBoard(lineup.format, lineup.formation, lineup.positions));
    setName(lineup.name);
    setEditingId(lineup.id);
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exportImage = async () => {
    if (!pitchRef.current) return;
    const dataUrl = await toPng(pitchRef.current, { cacheBust: true, pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `${name || 'composition'}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div>
      <h1 className="page-title">Composition tactique</h1>
      {message && <div className={message.includes('✅') ? 'success' : 'error'}>{message}</div>}

      <LineupBoard players={players} board={board} onChange={setBoard} pitchRef={pitchRef} />

      <div className="card toolbar" style={{ marginTop: '1rem' }}>
        <input style={{ maxWidth: 240 }} placeholder="Nom de la composition" value={name} onChange={(e) => setName(e.target.value)} />
        {isStaff ? (
          <button className="btn" onClick={save}>{editingId ? 'Mettre à jour' : 'Enregistrer'}</button>
        ) : (
          <span className="muted">Seul le staff peut enregistrer une composition.</span>
        )}
        <button className="btn secondary" onClick={exportImage}>📷 Exporter en image</button>
        <button className="btn secondary" onClick={reset}>Réinitialiser</button>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Compositions enregistrées</h3>
        {lineups.length === 0 && <p className="muted">Aucune composition.</p>}
        <div className="grid auto">
          {lineups.map((l) => (
            <div key={l.id} className="card" style={{ boxShadow: 'none' }}>
              <div className="spread">
                <b>{l.name}</b>
                <span className="badge gold">à {l.format} · {l.formation}</span>
              </div>
              <div className="row" style={{ marginTop: '0.5rem' }}>
                <button className="btn sm" onClick={() => load(l)}>Ouvrir</button>
                {isStaff && (
                  <button className="btn sm danger" onClick={async () => {
                    await api.del(`/lineups/${l.id}`);
                    setLineups((arr) => arr.filter((x) => x.id !== l.id));
                  }}>Supprimer</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
