import express from 'express';
import { listPackages, createPackage, updatePackage, deletePackage } from '../controllers/packageController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, listPackages);
router.post('/', protect, restrictTo('SuperAdmin', 'Admin'), createPackage);
router.put('/:id', protect, restrictTo('SuperAdmin', 'Admin'), updatePackage);
router.delete('/:id', protect, restrictTo('SuperAdmin', 'Admin'), deletePackage);

export default router;
