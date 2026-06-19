import { STAT_FIELDS, overallRating, ratingTier } from '../data/football.js';

const initials = (p) => `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`.toUpperCase();

// Carte joueur style fiche FIFA. Couleur selon la note (rouge → doré).
export default function FifaCard({ player, onClick }) {
  const stats = player.stats || {};
  const rating = overallRating(stats);
  const tier = ratingTier(rating);
  const shown = STAT_FIELDS.filter((f) => !f.isRisk).slice(0, 6);

  return (
    <div className={`fifa-card tier-${tier}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="fifa-number">#{player.number ?? '--'}{player.secondaryNumber != null ? ` / ${player.secondaryNumber}` : ''}</div>
      <div className="fifa-top">
        <div>
          <div className="fifa-rating">{rating || '--'}</div>
          <div className="fifa-pos">{player.mainPosition}</div>
        </div>
      </div>
      <div className="fifa-meta">
        {player.photoUrl ? (
          <img className="fifa-photo" src={player.photoUrl} alt={player.firstName} />
        ) : (
          <div className="fifa-photo">{initials(player)}</div>
        )}
        <div className="fifa-name">{player.firstName || player.lastName}</div>
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
