import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { transactionSchema, duesPaymentSchema, idParam } from '../schemas.js';

const router = Router();

// Liste des mois "YYYY-MM" depuis startMonth jusqu'au mois courant inclus.
function monthsSince(startMonth) {
  const [sy, sm] = startMonth.split('-').map(Number);
  const now = new Date();
  const ey = now.getUTCFullYear();
  const em = now.getUTCMonth() + 1;
  const months = [];
  let y = sy;
  let m = sm;
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return months;
}

// --- Compte de l'équipe ---------------------------------------------------

router.get(
  '/transactions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const transactions = await prisma.teamTransaction.findMany({
      where: { teamId: req.user.teamId },
      orderBy: { createdAt: 'desc' },
    });
    const dues = await prisma.duesPayment.aggregate({
      where: { player: { teamId: req.user.teamId } },
      _sum: { amount: true },
    });
    const movements = transactions.reduce(
      (acc, t) => acc + (t.type === 'DEPOSIT' ? t.amount : -t.amount),
      0,
    );
    const balance = movements + (dues._sum.amount || 0);
    res.json({ balance, transactions, duesCollected: dues._sum.amount || 0 });
  }),
);

router.post(
  '/transactions',
  requireAuth,
  requireStaff,
  validate({ body: transactionSchema }),
  asyncHandler(async (req, res) => {
    const tx = await prisma.teamTransaction.create({
      data: { ...req.body, teamId: req.user.teamId },
    });
    res.status(201).json(tx);
  }),
);

router.delete(
  '/transactions/:id',
  requireAuth,
  requireStaff,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    await prisma.teamTransaction.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

// --- Cotisations ----------------------------------------------------------

// Vue d'ensemble : total payé par joueur + retard (en mois).
router.get(
  '/dues',
  requireAuth,
  asyncHandler(async (req, res) => {
    const team = await prisma.team.findUnique({ where: { id: req.user.teamId } });
    const months = monthsSince(team.duesStartMonth);
    const players = await prisma.player.findMany({
      where: { teamId: req.user.teamId, status: 'APPROVED' },
      include: { duesPayments: true },
      orderBy: { lastName: 'asc' },
    });

    const rows = players.map((p) => {
      const paidMonths = new Set(p.duesPayments.map((d) => d.month));
      const totalPaid = p.duesPayments.reduce((acc, d) => acc + d.amount, 0);
      const lateMonths = months.filter((m) => !paidMonths.has(m));
      return {
        playerId: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        number: p.number,
        totalPaid,
        paidMonths: [...paidMonths].sort(),
        expectedMonths: months,
        expectedTotal: months.length * team.monthlyDues,
        lateCount: lateMonths.length,
        lateMonths,
      };
    });

    res.json({
      monthlyDues: team.monthlyDues,
      startMonth: team.duesStartMonth,
      months,
      rows,
    });
  }),
);

// Enregistrer un paiement de cotisation (staff).
router.post(
  '/dues',
  requireAuth,
  requireStaff,
  validate({ body: duesPaymentSchema }),
  asyncHandler(async (req, res) => {
    const team = await prisma.team.findUnique({ where: { id: req.user.teamId } });
    const { playerId, month, amount, description } = req.body;
    const payment = await prisma.duesPayment.upsert({
      where: { playerId_month: { playerId, month } },
      create: { playerId, month, amount: amount ?? team.monthlyDues, description },
      update: { amount: amount ?? team.monthlyDues, description },
    });
    res.status(201).json(payment);
  }),
);

// Annuler un paiement (staff).
router.delete(
  '/dues/:id',
  requireAuth,
  requireStaff,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    await prisma.duesPayment.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

export default router;
