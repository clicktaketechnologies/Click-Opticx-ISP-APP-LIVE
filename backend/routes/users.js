import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import userController from '../controllers/userController.js';

const router = express.Router();

// Signup Request Management
router.post('/signup-requests/:id/approve', protect, restrictTo('SuperAdmin', 'Admin'), userController.approveSignup);
router.post('/signup-requests/:id/reject',  protect, restrictTo('SuperAdmin', 'Admin'), userController.rejectSignup);

// User CRUD
router.get('/', protect, restrictTo('SuperAdmin', 'Admin', 'SupportAdmin', 'Manager'), userController.listUsers);
router.get('/:id', protect, userController.getUser);
router.post('/', protect, restrictTo('SuperAdmin', 'Admin'), userController.createUser);
router.patch('/:id', protect, restrictTo('SuperAdmin', 'Admin'), userController.updateUser);
router.delete('/:id', protect, restrictTo('SuperAdmin'), userController.softDeleteUser);
router.post('/:id/restore', protect, restrictTo('SuperAdmin'), userController.restoreUser);
router.post('/:id/transfer', protect, restrictTo('SuperAdmin', 'Admin'), userController.transferUser);
router.post('/import', protect, restrictTo('SuperAdmin', 'Admin'), userController.importUsers);


// Admin Actions
router.post('/:id/verify', protect, restrictTo('SuperAdmin', 'Admin'), userController.verifyUser);
router.post('/:id/unverify', protect, restrictTo('SuperAdmin', 'Admin'), userController.unverifyUser);
router.post('/:id/disable-login', protect, restrictTo('SuperAdmin', 'Admin'), userController.disableLogin);
router.post('/:id/enable-login', protect, restrictTo('SuperAdmin', 'Admin'), userController.enableLogin);
router.post('/:id/resend-verification', protect, restrictTo('SuperAdmin', 'Admin'), userController.resendVerification);

export default router;
