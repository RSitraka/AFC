import { useMemo, useState } from 'react';
import { FORMATS, FORMATIONS, formationSlots } from '../data/formations.js';
import PitchLines from './PitchLines.jsx';

const playerLabel = (p) => p?.firstName || p?.lastName || '';

// Jeton (clic pour ajouter / retirer / remplacer un joueur).
function Token({ player, label, x, y, onClick }) {
  return (
    <button
      type="button"
      className={`token ${player ? '' : 'empty'}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={onClick}
    >
      <span className="jersey">
        {player
          ? (player.photoUrl
            ? <img src={player.photoUrl} alt={playerLabel(player)} />
            : (player.number ?? playerLabel(player)[0]))
          : '+'}
      </span>
      {player && <span className="tname">{playerLabel(player)}</span>}
      <span className="tlabel">{label}</span>
    </button>
  );
}

// Modale de sélection d'un joueur.
function PlayerPicker({ title, players, onPick, onRemove, onClose }) {
  const [q, setQ] = useState('');
  const list = players.filter((p) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="spread">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button type="button" className="btn sm secondary" onClick={onClose}>✕</button>
        </div>
        {onRemove && (
          <button type="button" className="btn sm danger" style={{ marginTop: '0.6rem' }} onClick={onRemove}>
            Retirer ce joueur
          </button>
        )}
        <input style={{ marginTop: '0.6rem' }} placeholder="🔍 Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="picker-list">
          {list.length === 0 && <span className="muted">Aucun joueur disponible.</span>}
          {list.map((p) => (
            <button type="button" key={p.id} className="squad-chip" onClick={() => onPick(p.id)}>
              {p.photoUrl && <img className="chip-photo" src={p.photoUrl} alt="" />}
              <span className="num">{p.number ?? '–'}</span>{p.firstName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Plateau de composition (clic pour placer — compatible mobile).
// Contrôlé : `board = { format, formation, assignments, subs }`, `onChange(nextBoard)`.
export default function LineupBoard({ players, board, onChange, pitchRef, allowFormat = true }) {
  const { format, formation, assignments, subs } = board;
  const [picker, setPicker] = useState(null); // { type:'slot'|'sub', slotId? }

  const slots = useMemo(() => formationSlots(format, formation), [format, formation]);
  const byId = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);

  const assignedIds = new Set([...Object.values(assignments), ...subs]);
  const available = players.filter((p) => !assignedIds.has(p.id));

  const changeFormat = (f) => onChange({ format: f, formation: Object.keys(FORMATIONS[f])[0], assignments: {}, subs: [] });
  const changeFormation = (f) => onChange({ ...board, formation: f, assignments: {} });

  // Place un joueur (le retire d'abord de tout autre emplacement).
  const place = (playerId, target) => {
    const clearedAssign = Object.fromEntries(Object.entries(assignments).filter(([, pid]) => pid !== playerId));
    const nextSubs = subs.filter((id) => id !== playerId);
    if (target.type === 'sub') onChange({ ...board, assignments: clearedAssign, subs: [...nextSubs, playerId] });
    else onChange({ ...board, assignments: { ...clearedAssign, [target.slotId]: playerId }, subs: nextSubs });
    setPicker(null);
  };

  const removeFromSlot = (slotId) => {
    const next = { ...assignments };
    delete next[slotId];
    onChange({ ...board, assignments: next });
    setPicker(null);
  };
  const removeSub = (pid) => onChange({ ...board, subs: subs.filter((id) => id !== pid) });

  const filledCount = Object.values(assignments).filter(Boolean).length;
  const emptyCount = slots.length - filledCount;

  return (
    <div>
      <div className="card toolbar">
        {allowFormat && (
          <div className="pill-select">
            {FORMATS.map((f) => (
              <button key={f} type="button" className={`pill ${format === f ? 'active' : ''}`} onClick={() => changeFormat(f)}>
                Foot à {f}
              </button>
            ))}
          </div>
        )}
        <div className="pill-select">
          {Object.keys(FORMATIONS[format]).map((f) => (
            <button key={f} type="button" className={`pill ${formation === f ? 'active' : ''}`} onClick={() => changeFormation(f)}>
              {f}
            </button>
          ))}
        </div>
        <span className="badge gold">{filledCount}/{slots.length} titulaires</span>
        {emptyCount > 0 && <span className="badge red">{emptyCount} poste(s) vide(s)</span>}
        {subs.length > 0 && <span className="badge">{subs.length} remplaçant(s)</span>}
      </div>

      <div className="board-grid">
        <div className="pitch" ref={pitchRef}>
          <PitchLines />
          {slots.map((s) => {
            const player = byId[assignments[s.id]];
            return (
              <Token
                key={s.id}
                player={player}
                label={s.label}
                x={s.x}
                y={s.y}
                onClick={() => setPicker({ type: 'slot', slotId: s.id })}
              />
            );
          })}
        </div>

        <div className="card">
          <div className="spread">
            <h3>Remplaçants ({subs.length})</h3>
            <button type="button" className="btn sm" onClick={() => setPicker({ type: 'sub' })}>+ Ajouter</button>
          </div>
          <div className="bench">
            {subs.length === 0 && <span className="muted">Aucun remplaçant.</span>}
            {subs.map((pid) => byId[pid] && (
              <span key={pid} className="squad-chip">
                {byId[pid].photoUrl && <img className="chip-photo" src={byId[pid].photoUrl} alt="" />}
                <span className="num">{byId[pid].number ?? '–'}</span>{playerLabel(byId[pid])}
                <button type="button" className="btn sm danger" style={{ padding: '0 0.4rem' }} onClick={() => removeSub(pid)}>✕</button>
              </span>
            ))}
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>Touchez un poste « + » sur le terrain pour y placer un joueur.</p>
          <p className="muted" style={{ margin: 0 }}>Disponibles : {available.length}</p>
        </div>
      </div>

      {picker && (
        <PlayerPicker
          title={picker.type === 'sub' ? 'Ajouter un remplaçant' : 'Placer un joueur'}
          players={available}
          onPick={(pid) => place(pid, picker)}
          onRemove={picker.type === 'slot' && assignments[picker.slotId] ? () => removeFromSlot(picker.slotId) : null}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}

// Helpers partagés pour (dé)sérialiser un board vers/depuis l'API.
export function boardToPositions(board) {
  const slots = formationSlots(board.format, board.formation);
  return [
    ...slots.map((s) => ({
      playerId: board.assignments[s.id] || null,
      role: 'STARTER', x: s.x, y: s.y, positionLabel: s.label,
    })),
    ...board.subs.map((pid) => ({ playerId: pid, role: 'SUBSTITUTE', x: 0, y: 0, positionLabel: 'REMP' })),
  ];
}

export function positionsToBoard(format, formation, positions) {
  const slots = formationSlots(format, formation);
  const starters = positions.filter((p) => p.role === 'STARTER');
  const assignments = {};
  slots.forEach((s, i) => { if (starters[i]?.playerId) assignments[s.id] = starters[i].playerId; });
  const subs = positions.filter((p) => p.role === 'SUBSTITUTE' && p.playerId).map((p) => p.playerId);
  return { format, formation, assignments, subs };
}
