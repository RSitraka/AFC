// Schémas tactiques préconfigurés par format.
// Coordonnées en % : x (0 gauche -> 100 droite), y (0 attaque haut -> 100 défense bas).
// Le gardien (GK) est toujours en bas (y ~ 90).

const GK = { label: 'GK', x: 50, y: 90 };

// Helper : répartit n joueurs horizontalement sur une ligne à hauteur y.
function line(n, y, label, fromX = 16, toX = 84) {
  if (n === 1) return [{ label, x: 50, y }];
  const step = (toX - fromX) / (n - 1);
  return Array.from({ length: n }, (_, i) => ({ label, x: +(fromX + i * step).toFixed(1), y }));
}

export const FORMATS = [5, 7, 9, 11];

export const FORMATIONS = {
  5: {
    '2-2': [GK, ...line(2, 62, 'DEF', 28, 72), ...line(2, 30, 'FWD', 28, 72)],
    '1-2-1': [GK, ...line(1, 66, 'DEF'), ...line(2, 46, 'MID', 28, 72), ...line(1, 26, 'FWD')],
    '3-1': [GK, ...line(3, 60, 'DEF'), ...line(1, 28, 'FWD')],
    '1-3': [GK, ...line(1, 66, 'DEF'), ...line(3, 40, 'MID')],
  },
  7: {
    '2-3-1': [GK, ...line(2, 70, 'DEF', 30, 70), ...line(3, 46, 'MID'), ...line(1, 22, 'FWD')],
    '3-2-1': [GK, ...line(3, 70, 'DEF'), ...line(2, 46, 'MID', 32, 68), ...line(1, 22, 'FWD')],
    '2-1-2-1': [GK, ...line(2, 72, 'DEF', 30, 70), ...line(1, 56, 'MD'), ...line(2, 40, 'MID', 30, 70), ...line(1, 20, 'FWD')],
    '3-3': [GK, ...line(3, 68, 'DEF'), ...line(3, 36, 'FWD')],
  },
  9: {
    '3-3-2': [GK, ...line(3, 74, 'DEF'), ...line(3, 50, 'MID'), ...line(2, 26, 'FWD', 36, 64)],
    '3-2-3': [GK, ...line(3, 74, 'DEF'), ...line(2, 52, 'MID', 34, 66), ...line(3, 28, 'FWD')],
    '2-4-2': [GK, ...line(2, 74, 'DEF', 34, 66), ...line(4, 50, 'MID'), ...line(2, 26, 'FWD', 36, 64)],
    '3-4-1': [GK, ...line(3, 74, 'DEF'), ...line(4, 50, 'MID'), ...line(1, 24, 'FWD')],
  },
  11: {
    '4-4-2': [GK, ...line(4, 72, 'DEF'), ...line(4, 48, 'MID'), ...line(2, 24, 'FWD', 38, 62)],
    '4-3-3': [GK, ...line(4, 72, 'DEF'), ...line(3, 50, 'MID', 28, 72), ...line(3, 26, 'FWD')],
    '3-5-2': [GK, ...line(3, 74, 'DEF', 26, 74), ...line(5, 50, 'MID'), ...line(2, 24, 'FWD', 38, 62)],
    '4-2-3-1': [GK, ...line(4, 74, 'DEF'), ...line(2, 58, 'MD', 36, 64), ...line(3, 40, 'MID', 26, 74), ...line(1, 20, 'FWD')],
    '5-3-2': [GK, ...line(5, 74, 'DEF'), ...line(3, 50, 'MID', 28, 72), ...line(2, 25, 'FWD', 38, 62)],
  },
};

// Nombre de joueurs sur le terrain selon le format (GK inclus).
export const onPitchCount = (format) => format;

// Renvoie les positions d'une formation (slots starters) avec un id stable.
export function formationSlots(format, formation) {
  const slots = FORMATIONS[format]?.[formation] || [];
  return slots.map((s, i) => ({ id: `slot-${i}`, ...s }));
}
