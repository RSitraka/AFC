// Script ponctuel : supprime toutes les données d'argent (mouvements de compte
// + cotisations). Ne touche à aucun compte (l'admin et son mot de passe sont
// conservés). À exécuter comme job one-off sur Render.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const tx = await prisma.teamTransaction.deleteMany({});
const dues = await prisma.duesPayment.deleteMany({});

console.log('Mouvements de compte supprimés :', tx.count);
console.log('Cotisations supprimées :', dues.count);
console.log('Comptes (inchangés) :', await prisma.player.count());

await prisma.$disconnect();
