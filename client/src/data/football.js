// Données football partagées : postes, notes, pieds.

export const MAIN_POSITIONS = [
  { value: 'GK', label: 'Gardien' },
  { value: 'DEF', label: 'Défenseur' },
  { value: 'MID', label: 'Milieu' },
  { value: 'FWD', label: 'Attaquant' },
];

// Postes détaillés sélectionnables par le joueur.
export const DETAILED_POSITIONS = [
  { value: 'DB', label: 'DB — Défenseur balayeur' },
  { value: 'DC', label: 'DC — Défenseur central' },
  { value: 'DG', label: 'DG — Défenseur gauche' },
  { value: 'DD', label: 'DD — Défenseur droit' },
  { value: 'MD', label: 'MD — Milieu défensif' },
  { value: 'MG', label: 'MG — Milieu gauche' },
  { value: 'MOC', label: 'MOC — Milieu offensif central' },
  { value: 'MR', label: 'MR — Milieu relayeur' },
  { value: 'AC', label: 'AC — Avant-centre' },
  { value: 'AIG', label: 'AIG — Ailier gauche' },
  { value: 'AID', label: 'AID — Ailier droit' },
  { value: 'MLG', label: 'MLG — Milieu latéral gauche' },
  { value: 'MLD', label: 'MLD — Milieu latéral droit' },
];

export const STRONG_FEET = [
  { value: 'LEFT', label: 'Gauche' },
  { value: 'RIGHT', label: 'Droit' },
  { value: 'BOTH', label: 'Les deux' },
];

// Notes sur 10. risqueCrampe est un risque (plus bas = mieux) -> exclu de la moyenne.
export const STAT_FIELDS = [
  { key: 'vitesse', label: 'Vitesse', short: 'VIT' },
  { key: 'tir', label: 'Tir', short: 'TIR' },
  { key: 'passe', label: 'Passe', short: 'PAS' },
  { key: 'arret', label: 'Arrêt', short: 'ARR' },
  { key: 'reactivite', label: 'Réactivité', short: 'REA' },
  { key: 'saut', label: 'Saut', short: 'SAU' },
  { key: 'endurance', label: 'Endurance', short: 'END' },
  { key: 'balleAuPied', label: 'Balle au pied', short: 'BAP' },
  { key: 'defense', label: 'Défense', short: 'DEF' },
  { key: 'drible', label: 'Dribble', short: 'DRI' },
  { key: 'risqueCrampe', label: 'Risque de crampe', short: 'CRA', isRisk: true },
];

// Note globale FIFA : moyenne des notes positives (risqueCrampe exclu), sur 100.
export function overallRating(stats) {
  if (!stats) return 0;
  const positives = STAT_FIELDS.filter((f) => !f.isRisk);
  const sum = positives.reduce((acc, f) => acc + (Number(stats[f.key]) || 0), 0);
  const avg10 = sum / positives.length; // sur 10
  return Math.round(avg10 * 10); // sur 100, style FIFA
}

export const positionLabel = (value) =>
  DETAILED_POSITIONS.find((p) => p.value === value)?.label?.split(' — ')[1] || value;
