const express = require('express');
const router = express.Router();
const BulkProvision = require('../services/bulkProvisionService');
const enforceBilling = require('../jobs/billingEnforcement');
const VSOLService = require('../services/vsolOnuService');

router.post('/bulk-provision', async (req, res) => {
  try {
    const users = req.body.users || [];
    const result = await BulkProvision.run(users);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/run-billing-check', async (req, res) => {
  try {
    const { device, users } = req.body;
    if (!device || !users || !Array.isArray(users)) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }
    const disconnectedList = await enforceBilling(users, device);
    res.json({ success: true, count: disconnectedList.length, details: disconnectedList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vsol-wifi-reset', async (req, res) => {
  try {
    const { device, onuId, ssid, password } = req.body;
    if (!device || !onuId || !ssid || !password) {
      return res.status(400).json({ success: false, message: 'Missing required payload' });
    }

    const service = new VSOLService(device);
    const result = await service.changeWifiPassword({ onuId, ssid, newPassword: password });
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: 'FAILED', error: err.message });
  }
});

module.exports = router;
