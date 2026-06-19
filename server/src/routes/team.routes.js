import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { teamSchema } from '../schemas.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const team = await prisma.team.findUnique({ where: { id: req.user.teamId } });
    res.json(team);
  }),
);

router.put(
  '/',
  requireAuth,
  requireStaff,
  validate({ body: teamSchema }),
  asyncHandler(async (req, res) => {
    const body = { ...req.body };
    if (body.logoUrl === '') body.logoUrl = null;
    const team = await prisma.team.update({ where: { id: req.user.teamId }, data: body });
    res.json(team);
  }),
);

export default router;
