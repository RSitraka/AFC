import { STAT_FIELDS, overallRating } from '../data/football.js';

const initials = (p) => `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`.toUpperCase();

// Carte joueur style fiche FIFA, avec la note globale (moyenne).
export default function FifaCard({ player, onClick }) {
  const stats = player.stats || {};
  const rating = overallRating(stats);
  const isGk = player.mainPosition === 'GK';
  const shown = STAT_FIELDS.filter((f) => !f.isRisk).slice(0, 6);

  return (
    <div className={`fifa-card ${isGk ? 'gk' : ''}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="fifa-number">#{player.number ?? '--'}</div>
      <div className="fifa-top">
        <div>
          <div className="fifa-rating">{rating || '--'}</div>
          <div className="fifa-pos">{player.mainPosition}</div>
        </div>
      </div>
      <div className="fifa-meta">
        {player.photoUrl ? (
          <img className="fifa-photo" src={player.photoUrl} alt={player.lastName} />
        ) : (
          <div className="fifa-photo">{initials(player)}</div>
        )}
        <div className="fifa-name">{player.lastName || player.firstName}</div>
      </div>
      <div className="fifa-stats">
        {shown.map((f) => (
          <span key={f.key}>
            <b>{stats[f.key] ?? '-'}</b>
            {f.short}
          </span>
        ))}
      </div>
    </div>
  );
}
