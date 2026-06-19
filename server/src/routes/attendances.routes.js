import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { attendanceSchema, bulkAttendanceSchema } from '../schemas.js';

const router = Router();

const relationFor = (eventType, eventId) =>
  eventType === 'MATCH' ? { matchId: eventId } : { trainingId: eventId };

// Présences d'un événement : ?eventType=MATCH&eventId=...
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { eventType, eventId, playerId } = req.query;
    const where = {};
    if (eventType) where.eventType = eventType;
    if (eventId) where.eventId = eventId;
    if (playerId) where.playerId = playerId;

    const attendances = await prisma.attendance.findMany({
      where,
      include: { player: { select: { id: true, firstName: true, lastName: true, number: true } } },
    });
    res.json(attendances);
  }),
);

// Pointer une présence (staff).
router.post(
  '/',
  requireAuth,
  requireStaff,
  validate({ body: attendanceSchema }),
  asyncHandler(async (req, res) => {
    const { playerId, eventType, eventId, present } = req.body;
    const attendance = await prisma.attendance.upsert({
      where: { playerId_eventType_eventId: { playerId, eventType, eventId } },
      create: { playerId, eventType, eventId, present, ...relationFor(eventType, eventId) },
      update: { present },
    });
    res.status(201).json(attendance);
  }),
);

// Pointage en masse pour un événement (staff).
router.post(
  '/bulk',
  requireAuth,
  requireStaff,
  validate({ body: bulkAttendanceSchema }),
  asyncHandler(async (req, res) => {
    const { eventType, eventId, entries } = req.body;
    const results = await prisma.$transaction(
      entries.map((e) =>
        prisma.attendance.upsert({
          where: { playerId_eventType_eventId: { playerId: e.playerId, eventType, eventId } },
          create: { playerId: e.playerId, eventType, eventId, present: e.present, ...relationFor(eventType, eventId) },
          update: { present: e.present },
        }),
      ),
    );
    res.json(results);
  }),
);

export default router;
