const express = require('express');
const router = express.Router();
const cloudController = require('../controllers/cloudController');

router.get('/connect/google', cloudController.connectGoogle);
router.get('/google/callback', cloudController.googleCallback);

router.post('/account/save', cloudController.saveAccount);
router.put('/account/:id', cloudController.updateAccount);
router.delete('/account/:id', cloudController.deleteAccount);
router.post('/account/test', cloudController.testConnection);
router.post('/account/sync', cloudController.syncAccount);
router.post('/account/default', cloudController.setDefaultAccount);

router.get('/accounts', cloudController.getCloudAccounts);
router.post('/upload', cloudController.moveToCloud);

module.exports = router;
