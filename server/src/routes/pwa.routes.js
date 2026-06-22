import { Router } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../lib/prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../../client/dist');

const router = Router();

// Lecture seule : récupère le club par défaut (jamais d'écriture en base).
async function getTeam() {
  try {
    return await prisma.team.findFirst({ orderBy: { createdAt: 'asc' } });
  } catch {
    return null;
  }
}

function parseDataUrl(dataUrl) {
  const m = /^data:(image\/[\w+.-]+);base64,(.+)$/s.exec(dataUrl || '');
  if (!m) return null;
  return { mime: m[1], buffer: Buffer.from(m[2], 'base64') };
}

// Icône de l'app = logo du club (sinon tuile de repli).
router.get('/app-icon', async (req, res) => {
  const team = await getTeam();
  const parsed = parseDataUrl(team?.logoUrl);
  if (parsed) {
    res.set('Cache-Control', 'no-cache');
    return res.type(parsed.mime).send(parsed.buffer);
  }
  res.sendFile(path.join(clientDist, 'icons', 'icon-512.png'));
});

// apple-touch-icon : même logo (mime correct selon l'upload).
router.get('/apple-touch-icon', async (req, res) => {
  const team = await getTeam();
  const parsed = parseDataUrl(team?.logoUrl);
  if (parsed) {
    res.set('Cache-Control', 'no-cache');
    return res.type(parsed.mime).send(parsed.buffer);
  }
  res.sendFile(path.join(clientDist, 'icons', 'icon-180.png'));
});

// Manifeste PWA dynamique (nom, couleurs et icône du club).
router.get('/manifest.webmanifest', async (req, res) => {
  const team = await getTeam();
  const parsed = parseDataUrl(team?.logoUrl);
  const iconSrc = parsed ? '/app-icon' : '/icons/icon-512.png';
  const iconType = parsed ? parsed.mime : 'image/png';

  const manifest = {
    name: team?.name ? `${team.name}` : 'AFC — Gestion d\'équipe',
    short_name: team?.name || 'AFC',
    description: 'Gestion d\'équipe de football',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f1b12',
    theme_color: team?.primaryColor || '#15803d',
    icons: [
      { src: iconSrc, sizes: '192x192', type: iconType, purpose: 'any' },
      { src: iconSrc, sizes: '512x512', type: iconType, purpose: 'any' },
      // Icône maskable garantie (Android) — tuile aux couleurs du club.
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  res.set('Cache-Control', 'no-cache');
  res.type('application/manifest+json').send(JSON.stringify(manifest));
});

export default router;
