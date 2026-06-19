import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './lib/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// client/dist se trouve à la racine du monorepo : server/src -> ../../client/dist
const clientDist = path.resolve(__dirname, '../../client/dist');

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '8mb' })); // marge pour les photos uploadées (data URL)
  app.use(cookieParser());
  app.use(morgan(env.isProd ? 'tiny' : 'dev'));

  // En dev le front (Vite) tourne sur un autre port : on autorise le CORS.
  if (!env.isProd) {
    app.use(cors({ origin: true, credentials: true }));
  }

  // API
  app.use('/api', apiRoutes);
  app.use('/api', notFound);

  // En production, Express sert le build statique du front.
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    // Fallback SPA : toute route non-API renvoie index.html.
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  } else {
    app.get('/', (req, res) =>
      res.json({ message: 'API AFC en ligne. Build front absent (client/dist).' }),
    );
  }

  app.use(errorHandler);
  return app;
}
