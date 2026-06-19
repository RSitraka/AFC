import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Statistiques agrégées du tableau de bord.
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const teamId = req.user.teamId;

    const [team, matches, players, transactions, duesAgg] = await Promise.all([
      prisma.team.findUnique({ where: { id: teamId } }),
      prisma.match.findMany({
        where: { teamId, scoreFor: { not: null } },
        include: { scorers: { select: { id: true } } },
      }),
      prisma.player.findMany({
        where: { teamId, status: 'APPROVED' },
        include: { stats: true, _count: { select: { attendances: true, matchParticipations: true } } },
        orderBy: [{ number: 'asc' }, { lastName: 'asc' }],
      }),
      prisma.teamTransaction.findMany({ where: { teamId } }),
      prisma.duesPayment.aggregate({ where: { player: { teamId } }, _sum: { amount: true } }),
    ]);

    // Moyenne de buts marqués par format de match (5/7/9/11).
    const byFormat = {};
    for (const fmt of [5, 7, 9, 11]) byFormat[fmt] = { played: 0, goalsFor: 0, goalsAgainst: 0 };
    for (const m of matches) {
      const f = byFormat[m.format] || (byFormat[m.format] = { played: 0, goalsFor: 0, goalsAgainst: 0 });
      f.played += 1;
      f.goalsFor += m.scoreFor || 0;
      f.goalsAgainst += m.scoreAgainst || 0;
    }
    const goalsByFormat = Object.entries(byFormat).map(([format, v]) => ({
      format: Number(format),
      played: v.played,
      goalsFor: v.goalsFor,
      goalsAgainst: v.goalsAgainst,
      avgGoalsFor: v.played ? +(v.goalsFor / v.played).toFixed(2) : 0,
      avgGoalsAgainst: v.played ? +(v.goalsAgainst / v.played).toFixed(2) : 0,
    }));

    // Meilleur buteur.
    const goalCounts = {};
    for (const m of matches) {
      for (const s of m.scorers) goalCounts[s.id] = (goalCounts[s.id] || 0) + 1;
    }
    const topScorers = players
      .map((p) => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, number: p.number, goals: goalCounts[p.id] || 0 }))
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);

    // Joueurs les plus utilisés (nombre de matchs joués).
    const mostUsed = players
      .map((p) => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, number: p.number, matchesPlayed: p._count.matchParticipations }))
      .sort((a, b) => b.matchesPlayed - a.matchesPlayed)
      .slice(0, 5);

    const movements = transactions.reduce((acc, t) => acc + (t.type === 'DEPOSIT' ? t.amount : -t.amount), 0);
    const balance = movements + (duesAgg._sum.amount || 0);

    res.json({
      team,
      balance,
      playerCount: players.length,
      matchCount: matches.length,
      goalsByFormat,
      topScorers,
      mostUsed,
      players: players.map(({ passwordHash, ...p }) => ({ ...p, matchesPlayed: p._count.matchParticipations })),
    });
  }),
);

export default router;
