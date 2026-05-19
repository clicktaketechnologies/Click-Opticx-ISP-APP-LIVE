import express from 'express';
const router = express.Router();
import * as nasController from '../controllers/nasController.js';

// Sync a subscriber's credentials to the MikroTik router
router.post('/nas/sync', nasController.syncSubscriber);

// Execute a CoA command (Disconnect, SpeedChange)
router.post('/nas/coa', nasController.executeCoA);

// Real-time health check for a NAS node
router.post('/nas/health', nasController.checkHealth);

// Fetch live router statistics
router.get('/nas/stats', nasController.getNasStats);

export default router;
