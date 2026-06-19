import { ZodError } from 'zod';

// Erreur applicative avec code HTTP.
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Enrobe les handlers async pour propager les erreurs vers le middleware.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// 404 par défaut pour les routes API inconnues.
export function notFound(req, res) {
  res.status(404).json({ error: 'Ressource introuvable' });
}

// Gestionnaire d'erreurs central.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation échouée',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }

  // Erreurs Prisma connues
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Conflit : valeur déjà utilisée', details: err.meta?.target });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Ressource introuvable' });
  }

  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
}
