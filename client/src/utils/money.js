// La devise de l'équipe est l'ariary (Ar).
const nf = new Intl.NumberFormat('fr-FR');

export const formatAr = (n) => `${nf.format(Math.round(Number(n) || 0))} Ar`;
