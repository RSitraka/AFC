import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { matchSchema, idParam } from '../schemas.js';

const router = Router();

const matchInclude = {
  scorers: { select: { id: true, firstName: true, lastName: true } },
  participants: {
    include: { player: { select: { id: true, firstName: true, lastName: true, number: true } } },
  },
};

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const matches = await prisma.match.findMany({
      where: { teamId: req.user.teamId },
      include: matchInclude,
      orderBy: { date: 'desc' },
    });
    res.json(matches);
  }),
);

router.get(
  '/:id',
  requireAuth,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: { ...matchInclude, attendances: true },
    });
    res.json(match);
  }),
);

// Crée/maj les participants + synchronise les présences (présent = a joué).
async function syncParticipants(tx, matchId, participants) {
  await tx.matchParticipant.deleteMany({ where: { matchId } });
  await tx.attendance.deleteMany({ where: { eventType: 'MATCH', eventId: matchId } });
  if (!participants?.length) return;

  await tx.matchParticipant.createMany({
    data: participants.map((p) => ({
      matchId,
      playerId: p.playerId,
      role: p.role,
      positionLabel: p.positionLabel || null,
      x: p.x ?? null,
      y: p.y ?? null,
    })),
    skipDuplicates: true,
  });
  // Les convoqués sont marqués présents au match.
  await tx.attendance.createMany({
    data: participants.map((p) => ({
      playerId: p.playerId,
      eventType: 'MATCH',
      eventId: matchId,
      matchId,
      present: true,
    })),
    skipDuplicates: true,
  });
}

router.post(
  '/',
  requireAuth,
  requireStaff,
  validate({ body: matchSchema }),
  asyncHandler(async (req, res) => {
    const { scorerIds, participants, ...rest } = req.body;
    const match = await prisma.$transaction(async (tx) => {
      const created = await tx.match.create({
        data: {
          ...rest,
          teamId: req.user.teamId,
          ...(scorerIds ? { scorers: { connect: scorerIds.map((id) => ({ id })) } } : {}),
        },
      });
      await syncParticipants(tx, created.id, participants);
      return tx.match.findUnique({ where: { id: created.id }, include: matchInclude });
    });
    res.status(201).json(match);
  }),
);

router.put(
  '/:id',
  requireAuth,
  requireStaff,
  validate({ params: idParam, body: matchSchema }),
  asyncHandler(async (req, res) => {
    const { scorerIds, participants, ...rest } = req.body;
    const match = await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: req.params.id },
        data: {
          ...rest,
          ...(scorerIds ? { scorers: { set: scorerIds.map((id) => ({ id })) } } : {}),
        },
      });
      if (participants !== undefined) await syncParticipants(tx, req.params.id, participants);
      return tx.match.findUnique({ where: { id: req.params.id }, include: matchInclude });
    });
    res.json(match);
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireStaff,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    await prisma.match.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

export default router;
