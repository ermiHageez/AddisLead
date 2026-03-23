import { Router } from 'express';
import { generateAIContent, getAIHistory } from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/generate', generateAIContent);
router.get('/history', getAIHistory);

export default router;
