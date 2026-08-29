import express from 'express';
const router = express.Router();
import * as nasController from '../controllers/nasController.js';
import { protect, restrictTo } from '../middleware/auth.js';

// SECURITY: these endpoints drive real MikroTik/RADIUS actions (provisioning,
// CoA disconnects). They were previously open to the public internet with no
// authentication — anyone could disconnect arbitrary subscribers.
// All routes require a valid session; mutations additionally require staff roles.
router.use(protect);

// Sync a subscriber's credentials to the MikroTik router
router.post('/nas/sync', restrictTo('SuperAdmin', 'Admin', 'Network Admin', 'NetworkAdmin'), nasController.syncSubscriber);

// Execute a CoA command (Disconnect, SpeedChange)
router.post('/nas/coa', restrictTo('SuperAdmin', 'Admin', 'Network Admin', 'NetworkAdmin'), nasController.executeCoA);

// Real-time health check for a NAS node
router.post('/nas/health', nasController.checkHealth);

// Fetch live router statistics
router.get('/nas/stats', nasController.getNasStats);

export default router;
