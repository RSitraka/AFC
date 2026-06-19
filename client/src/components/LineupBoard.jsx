import { useMemo, useState } from 'react';
import { DndContext, useDraggable, useDroppable, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { FORMATS, FORMATIONS, formationSlots } from '../data/formations.js';
import PitchLines from './PitchLines.jsx';

const playerLabel = (p) => p?.lastName || p?.firstName || '';

function Token({ id, player, label }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, data: { playerId: player?.id } });
  return (
    <div
      ref={setNodeRef}
      className={`token ${player ? '' : 'empty'}`}
      style={{ left: 0, top: 0, opacity: isDragging ? 0.3 : 1 }}
      {...(player ? listeners : {})}
      {...(player ? attributes : {})}
    >
      <div className="jersey">{player ? (player.number ?? playerLabel(player)[0]) : '+'}</div>
      {player && <div className="tname">{playerLabel(player)}</div>}
      <div className="tlabel">{label}</div>
    </div>
  );
}

function Slot({ slot, player }) {
  const { setNodeRef, isOver } = useDroppable({ id: slot.id, data: { slotId: slot.id } });
  return (
    <div ref={setNodeRef} style={{ position: 'absolute', left: `${slot.x}%`, top: `${slot.y}%`, width: 1, height: 1 }}>
      <div style={{ position: 'absolute', outline: isOver ? '2px dashed #fff' : 'none', borderRadius: 8 }}>
        <Token id={`tok-${slot.id}`} player={player} label={slot.label} />
      </div>
    </div>
  );
}

function DropZone({ id, children, title }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="card" ref={setNodeRef} style={{ outline: isOver ? '2px dashed var(--club-primary)' : 'none' }}>
      <h3>{title}</h3>
      <div className="bench">{children}</div>
    </div>
  );
}

function SquadChip({ player }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `squad-${player.id}`, data: { playerId: player.id } });
  return (
    <div ref={setNodeRef} className="squad-chip" style={{ opacity: isDragging ? 0.3 : 1 }} {...listeners} {...attributes}>
      <span className="num">{player.number ?? '–'}</span>{playerLabel(player)}
    </div>
  );
}

// Plateau de composition réutilisable (terrain + effectif + remplaçants).
// Contrôlé : `board = { format, formation, assignments, subs }`, `onChange(nextBoard)`.
export default function LineupBoard({ players, board, onChange, pitchRef, allowFormat = true }) {
  const { format, formation, assignments, subs } = board;
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const slots = useMemo(() => formationSlots(format, formation), [format, formation]);
  const byId = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);

  const assignedIds = new Set([...Object.values(assignments), ...subs]);
  const available = players.filter((p) => !assignedIds.has(p.id));

  const changeFormat = (f) => {
    onChange({ format: f, formation: Object.keys(FORMATIONS[f])[0], assignments: {}, subs: [] });
  };
  const changeFormation = (f) => onChange({ ...board, formation: f, assignments: {} });

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const playerId = active.data.current?.playerId;
    if (!playerId) return;

    const clearedAssign = Object.fromEntries(Object.entries(assignments).filter(([, pid]) => pid !== playerId));
    const nextSubs = subs.filter((id) => id !== playerId);

    if (over.id === 'subs') {
      onChange({ ...board, assignments: clearedAssign, subs: [...nextSubs, playerId] });
    } else if (over.id === 'squad') {
      onChange({ ...board, assignments: clearedAssign, subs: nextSubs });
    } else {
      onChange({ ...board, assignments: { ...clearedAssign, [over.id]: playerId }, subs: nextSubs });
    }
  };

  const filledCount = Object.values(assignments).filter(Boolean).length;
  const emptyCount = slots.length - filledCount;
  const activePlayer = activeId ? byId[activeId] : null;

  return (
    <div>
      <div className="card toolbar">
        {allowFormat && (
          <div className="pill-select">
            {FORMATS.map((f) => (
              <button key={f} className={`pill ${format === f ? 'active' : ''}`} onClick={() => changeFormat(f)}>
                Foot à {f}
              </button>
            ))}
          </div>
        )}
        <div className="pill-select">
          {Object.keys(FORMATIONS[format]).map((f) => (
            <button key={f} className={`pill ${formation === f ? 'active' : ''}`} onClick={() => changeFormation(f)}>
              {f}
            </button>
          ))}
        </div>
        <span className="badge gold">{filledCount}/{slots.length} titulaires</span>
        {emptyCount > 0 && <span className="badge red">{emptyCount} poste(s) vide(s)</span>}
        {subs.length > 0 && <span className="badge">{subs.length} remplaçant(s)</span>}
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(e) => setActiveId(e.active.data.current?.playerId)}
        onDragEnd={handleDragEnd}
      >
        <div className="board-grid">
          <div className="pitch" ref={pitchRef}>
            <PitchLines />
            {slots.map((s) => <Slot key={s.id} slot={s} player={byId[assignments[s.id]]} />)}
          </div>

          <div className="grid" style={{ gap: '1rem' }}>
            <DropZone id="squad" title={`Effectif (${available.length})`}>
              {available.length === 0 && <span className="muted">Tous placés.</span>}
              {available.map((p) => <SquadChip key={p.id} player={p} />)}
            </DropZone>
            <DropZone id="subs" title={`Remplaçants (${subs.length})`}>
              {subs.length === 0 && <span className="muted">Glissez ici les remplaçants.</span>}
              {subs.map((pid) => byId[pid] && <SquadChip key={pid} player={byId[pid]} />)}
            </DropZone>
          </div>
        </div>

        <DragOverlay>
          {activePlayer && (
            <div className="squad-chip" style={{ cursor: 'grabbing' }}>
              <span className="num">{activePlayer.number ?? '–'}</span>{playerLabel(activePlayer)}
            </div>
          )}
        </DragOverlay>
      </DndContext>
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
