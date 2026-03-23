import { Router } from 'express';
import { getDashboardStats, getInsights } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/insights', getInsights);

export default router;
