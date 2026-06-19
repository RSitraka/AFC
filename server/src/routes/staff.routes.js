import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { staffSchema, idParam } from '../schemas.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const staff = await prisma.staff.findMany({
      where: { teamId: req.user.teamId },
      orderBy: { fullName: 'asc' },
    });
    res.json(staff);
  }),
);

router.post(
  '/',
  requireAuth,
  requireStaff,
  validate({ body: staffSchema }),
  asyncHandler(async (req, res) => {
    const body = { ...req.body };
    if (body.photoUrl === '') body.photoUrl = null;
    const staff = await prisma.staff.create({ data: { ...body, teamId: req.user.teamId } });
    res.status(201).json(staff);
  }),
);

router.put(
  '/:id',
  requireAuth,
  requireStaff,
  validate({ params: idParam, body: staffSchema }),
  asyncHandler(async (req, res) => {
    const body = { ...req.body };
    if (body.photoUrl === '') body.photoUrl = null;
    const staff = await prisma.staff.update({ where: { id: req.params.id }, data: body });
    res.json(staff);
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireStaff,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    await prisma.staff.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

export default router;
