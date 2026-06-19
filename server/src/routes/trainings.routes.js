import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { trainingSchema, idParam } from '../schemas.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const trainings = await prisma.training.findMany({
      where: { teamId: req.user.teamId },
      orderBy: { date: 'desc' },
    });
    res.json(trainings);
  }),
);

router.post(
  '/',
  requireAuth,
  requireStaff,
  validate({ body: trainingSchema }),
  asyncHandler(async (req, res) => {
    const training = await prisma.training.create({ data: { ...req.body, teamId: req.user.teamId } });
    res.status(201).json(training);
  }),
);

router.put(
  '/:id',
  requireAuth,
  requireStaff,
  validate({ params: idParam, body: trainingSchema }),
  asyncHandler(async (req, res) => {
    const training = await prisma.training.update({ where: { id: req.params.id }, data: req.body });
    res.json(training);
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireStaff,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    await prisma.training.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

export default router;
