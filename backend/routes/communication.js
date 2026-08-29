import express from 'express';
import commController from '../controllers/communicationController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.post('/config', protect, restrictTo('Admin', 'SuperAdmin'), commController.saveConfig);
router.post('/verify', protect, restrictTo('Admin', 'SuperAdmin'), commController.verifyConnection);
router.post('/send', protect, commController.sendNotification);
router.get('/logs', protect, restrictTo('Admin', 'SuperAdmin'), commController.getLogs);

export default router;
