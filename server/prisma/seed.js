import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@afc.local').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';

async function main() {
  // 1) Équipe (créée une seule fois).
  let team = await prisma.team.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!team) {
    team = await prisma.team.create({
      data: {
        name: 'AFC',
        primaryColor: '#15803d',
        secondaryColor: '#facc15',
        monthlyDues: 10,
        duesStartMonth: '2026-06',
      },
    });
    console.log('✔ Équipe créée :', team.name);
  }

  // 2) Compte staff par défaut "admin" — SEUL compte créé.
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.player.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: 'STAFF', status: 'APPROVED' },
    create: {
      teamId: team.id,
      email: ADMIN_EMAIL,
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'AFC',
      role: 'STAFF',
      status: 'APPROVED',
      profileCompleted: true,
      number: 99,
      mainPosition: 'MID',
      positions: ['MOC'],
      strongFoot: 'RIGHT',
      stats: { create: {} },
    },
  });
  console.log(`✔ Compte staff par défaut : ${ADMIN_EMAIL}`);
  console.log('✅ Seed terminé (compte admin uniquement).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
