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

export default router;
