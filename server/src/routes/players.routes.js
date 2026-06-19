import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { ApiError, asyncHandler } from '../middleware/error.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { updatePlayerSchema, statsSchema, passwordChangeSchema, idParam } from '../schemas.js';

const router = Router();

const strip = (p) => {
  if (!p) return p;
  const { passwordHash, ...rest } = p;
  return rest;
};

// Liste des joueurs (approuvés par défaut, ?status=PENDING pour les demandes).
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { status, position, role } = req.query;
    const where = { teamId: req.user.teamId };
    if (status) where.status = status;
    else where.status = 'APPROVED';
    if (role) where.role = role;
    if (position) where.OR = [{ mainPosition: position }, { positions: { has: position } }];

    const players = await prisma.player.findMany({
      where,
      include: { stats: true, _count: { select: { matchParticipations: true } } },
      orderBy: [{ number: 'asc' }, { lastName: 'asc' }],
    });
    res.json(players.map((p) => ({ ...strip(p), matchesPlayed: p._count.matchParticipations })));
  }),
);

// Comptes en attente de validation (staff).
router.get(
  '/pending',
  requireAuth,
  requireStaff,
  asyncHandler(async (req, res) => {
    const players = await prisma.player.findMany({
      where: { teamId: req.user.teamId, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
    res.json(players.map(strip));
  }),
);

// Détail d'un joueur.
router.get(
  '/:id',
  requireAuth,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const player = await prisma.player.findUnique({
      where: { id: req.params.id },
      include: { stats: true, _count: { select: { matchParticipations: true } } },
    });
    if (!player) throw new ApiError(404, 'Joueur introuvable');
    res.json({ ...strip(player), matchesPlayed: player._count.matchParticipations });
  }),
);

// Mise à jour du profil : le joueur lui-même OU un staff.
router.put(
  '/:id',
  requireAuth,
  validate({ params: idParam, body: updatePlayerSchema }),
  asyncHandler(async (req, res) => {
    const isSelf = req.user.id === req.params.id;
    if (!isSelf && req.user.role !== 'STAFF') {
      throw new ApiError(403, 'Vous ne pouvez modifier que votre profil');
    }
    const { stats, ...profile } = req.body;
    if (profile.photoUrl === '') profile.photoUrl = null;

    const player = await prisma.player.update({
      where: { id: req.params.id },
      data: {
        ...profile,
        profileCompleted: true,
        // Les stats ne sont modifiables que par le joueur lui-même.
        ...(stats && isSelf
          ? { stats: { upsert: { create: stats, update: stats } } }
          : {}),
      },
      include: { stats: true },
    });
    res.json(strip(player));
  }),
);

// Notes FIFA : modifiables UNIQUEMENT par le joueur concerné.
router.put(
  '/:id/stats',
  requireAuth,
  validate({ params: idParam, body: statsSchema }),
  asyncHandler(async (req, res) => {
    if (req.user.id !== req.params.id) {
      throw new ApiError(403, 'Seul le joueur peut modifier ses propres notes');
    }
    const stats = await prisma.playerStats.upsert({
      where: { playerId: req.params.id },
      create: { playerId: req.params.id, ...req.body },
      update: req.body,
    });
    res.json(stats);
  }),
);

// Changement de mot de passe.
// - Le joueur lui-même : doit fournir son mot de passe actuel.
// - Un staff : peut réinitialiser le mot de passe de n'importe quel compte.
router.put(
  '/:id/password',
  requireAuth,
  validate({ params: idParam, body: passwordChangeSchema }),
  asyncHandler(async (req, res) => {
    const isSelf = req.user.id === req.params.id;
    const isStaff = req.user.role === 'STAFF';
    if (!isSelf && !isStaff) throw new ApiError(403, 'Action non autorisée');

    const target = await prisma.player.findUnique({ where: { id: req.params.id } });
    if (!target) throw new ApiError(404, 'Compte introuvable');

    if (isSelf && !isStaff) {
      const ok = await bcrypt.compare(req.body.currentPassword || '', target.passwordHash);
      if (!ok) throw new ApiError(400, 'Mot de passe actuel incorrect');
    }

    const passwordHash = await bcrypt.hash(req.body.newPassword, 10);
    await prisma.player.update({ where: { id: req.params.id }, data: { passwordHash } });
    res.json({ message: 'Mot de passe mis à jour' });
  }),
);

// Validation d'un compte (staff).
router.post(
  '/:id/approve',
  requireAuth,
  requireStaff,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const player = await prisma.player.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED' },
    });
    res.json(strip(player));
  }),
);

// Refus d'un compte (staff).
router.post(
  '/:id/reject',
  requireAuth,
  requireStaff,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const player = await prisma.player.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' },
    });
    res.json(strip(player));
  }),
);

// Promotion / rétrogradation staff (staff).
router.post(
  '/:id/role',
  requireAuth,
  requireStaff,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const role = req.body?.role === 'STAFF' ? 'STAFF' : 'PLAYER';
    const player = await prisma.player.update({ where: { id: req.params.id }, data: { role } });
    res.json(strip(player));
  }),
);

// Suppression d'un joueur (staff).
router.delete(
  '/:id',
  requireAuth,
  requireStaff,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    if (req.user.id === req.params.id) throw new ApiError(400, 'Vous ne pouvez pas supprimer votre propre compte');
    await prisma.player.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

export default router;
