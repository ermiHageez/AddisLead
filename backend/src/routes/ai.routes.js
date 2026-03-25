import { Router } from 'express';
import { generateAIContent, getAIHistory } from '../controllers/ai.controller.js';
import { getAiUsage } from '../controllers/subscriptionController.js';
import { authenticate } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: { success: false, message: 'Too many AI requests, please try again later' },
});

router.use(authenticate);

router.post('/generate', aiLimiter, generateAIContent);
router.get('/history', getAIHistory);
router.get('/usage', getAiUsage);

export default router;
