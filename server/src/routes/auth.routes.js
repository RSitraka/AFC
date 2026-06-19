import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { ApiError, asyncHandler } from '../middleware/error.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { registerSchema, loginSchema, completeProfileSchema } from '../schemas.js';

const router = Router();

const publicPlayer = (p) => {
  const { passwordHash, ...rest } = p;
  return rest;
};

// Renvoie l'équipe par défaut (application mono-club).
async function getDefaultTeam() {
  let team = await prisma.team.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!team) team = await prisma.team.create({ data: { name: 'Mon Club' } });
  return team;
}

// Inscription — le compte est créé en attente de validation par un staff.
router.post(
  '/register',
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    const team = await getDefaultTeam();
    const passwordHash = await bcrypt.hash(password, 10);

    const player = await prisma.player.create({
      data: {
        teamId: team.id,
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        role: 'PLAYER',
        status: 'PENDING',
        stats: { create: {} },
      },
    });

    res.status(201).json({
      message: 'Compte créé. En attente de validation par un staff.',
      player: publicPlayer(player),
    });
  }),
);

// Connexion.
router.post(
  '/login',
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const player = await prisma.player.findUnique({ where: { email: email.toLowerCase() } });
    if (!player) throw new ApiError(401, 'Identifiants invalides');

    const ok = await bcrypt.compare(password, player.passwordHash);
    if (!ok) throw new ApiError(401, 'Identifiants invalides');

    if (player.status === 'PENDING') {
      throw new ApiError(403, 'Compte en attente de validation par un staff');
    }
    if (player.status === 'REJECTED') {
      throw new ApiError(403, 'Compte refusé. Contactez un staff.');
    }

    const token = signToken(player);
    res.json({ token, player: publicPlayer(player) });
  }),
);

// Profil de l'utilisateur connecté.
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const player = await prisma.player.findUnique({
      where: { id: req.user.id },
      include: { stats: true, team: true },
    });
    res.json(publicPlayer(player));
  }),
);

// Complétion / mise à jour du profil (première connexion).
router.put(
  '/profile',
  requireAuth,
  validate({ body: completeProfileSchema }),
  asyncHandler(async (req, res) => {
    const { stats, ...profile } = req.body;
    const data = { ...profile, profileCompleted: true };
    if (data.photoUrl === '') data.photoUrl = null;

    const player = await prisma.player.update({
      where: { id: req.user.id },
      data: {
        ...data,
        ...(stats
          ? { stats: { upsert: { create: stats, update: stats } } }
          : {}),
      },
      include: { stats: true },
    });
    res.json(publicPlayer(player));
  }),
);

export default router;
