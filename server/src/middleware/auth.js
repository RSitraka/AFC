import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';
import { prisma } from '../lib/prisma.js';
import { ApiError, asyncHandler } from './error.js';

export function signToken(player) {
  return jwt.sign({ sub: player.id, role: player.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

// Exige un compte authentifié et approuvé.
export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;
  if (!token) throw new ApiError(401, 'Authentification requise');

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new ApiError(401, 'Session invalide ou expirée');
  }

  const player = await prisma.player.findUnique({ where: { id: payload.sub } });
  if (!player) throw new ApiError(401, 'Compte introuvable');
  if (player.status !== 'APPROVED') {
    throw new ApiError(403, 'Compte en attente de validation par un staff');
  }

  req.user = player;
  next();
});

// Exige le rôle STAFF (en plus d'être authentifié).
export const requireStaff = asyncHandler(async (req, res, next) => {
  if (!req.user) throw new ApiError(401, 'Authentification requise');
  if (req.user.role !== 'STAFF') throw new ApiError(403, 'Action réservée au staff');
  next();
});
