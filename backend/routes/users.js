const router = require('express').Router();
const { protect, restrictTo } = require('../middleware/auth');
const userController = require('../controllers/userController');

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

module.exports = router;
