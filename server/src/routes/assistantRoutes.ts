import { Router } from 'express';
import { askAssistant } from '../controllers/assistantController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.post('/query', askAssistant);

export default router;
