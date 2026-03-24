import { Router } from 'express';
import { getLeads, createLead, getLeadById, updateLead, deleteLead } from '../controllers/lead.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createLeadSchema, updateLeadSchema } from '../validators/lead.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', getLeads);
router.post('/', validate(createLeadSchema), createLead);
router.get('/:id', getLeadById);
router.patch('/:id', validate(updateLeadSchema), updateLead);
router.delete('/:id', deleteLead);

export default router;
