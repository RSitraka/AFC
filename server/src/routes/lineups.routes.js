import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { lineupSchema, idParam } from '../schemas.js';

const router = Router();

const positionInclude = {
  positions: {
    include: {
      player: { select: { id: true, firstName: true, lastName: true, number: true, photoUrl: true } },
    },
  },
};

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const lineups = await prisma.lineup.findMany({
      where: { teamId: req.user.teamId },
      include: positionInclude,
      orderBy: { updatedAt: 'desc' },
    });
    res.json(lineups);
  }),
);

router.get(
  '/:id',
  requireAuth,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const lineup = await prisma.lineup.findUnique({
      where: { id: req.params.id },
      include: positionInclude,
    });
    res.json(lineup);
  }),
);

const positionData = (positions) =>
  positions.map((p) => ({
    playerId: p.playerId || null,
    role: p.role,
    x: p.x,
    y: p.y,
    positionLabel: p.positionLabel || null,
  }));

// Enregistrer une composition — réservé au staff.
router.post(
  '/',
  requireAuth,
  requireStaff,
  validate({ body: lineupSchema }),
  asyncHandler(async (req, res) => {
    const { name, format, formation, positions } = req.body;
    const lineup = await prisma.lineup.create({
      data: {
        teamId: req.user.teamId,
        name,
        format,
        formation,
        positions: { create: positionData(positions) },
      },
      include: positionInclude,
    });
    res.status(201).json(lineup);
  }),
);

// Mettre à jour une composition — réservé au staff.
router.put(
  '/:id',
  requireAuth,
  requireStaff,
  validate({ params: idParam, body: lineupSchema }),
  asyncHandler(async (req, res) => {
    const { name, format, formation, positions } = req.body;
    const lineup = await prisma.$transaction(async (tx) => {
      await tx.lineupPosition.deleteMany({ where: { lineupId: req.params.id } });
      return tx.lineup.update({
        where: { id: req.params.id },
        data: { name, format, formation, positions: { create: positionData(positions) } },
        include: positionInclude,
      });
    });
    res.json(lineup);
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireStaff,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    await prisma.lineup.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

export default router;
