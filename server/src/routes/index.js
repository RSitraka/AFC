import { Router } from 'express';
import authRoutes from './auth.routes.js';
import teamRoutes from './team.routes.js';
import playersRoutes from './players.routes.js';
import staffRoutes from './staff.routes.js';
import matchesRoutes from './matches.routes.js';
import trainingsRoutes from './trainings.routes.js';
import attendancesRoutes from './attendances.routes.js';
import lineupsRoutes from './lineups.routes.js';
import financesRoutes from './finances.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

router.use('/auth', authRoutes);
router.use('/team', teamRoutes);
router.use('/players', playersRoutes);
router.use('/staff', staffRoutes);
router.use('/matches', matchesRoutes);
router.use('/trainings', trainingsRoutes);
router.use('/attendances', attendancesRoutes);
router.use('/lineups', lineupsRoutes);
router.use('/finances', financesRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
