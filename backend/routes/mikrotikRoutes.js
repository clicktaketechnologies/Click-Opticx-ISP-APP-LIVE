const express = require('express');
const router = express.Router();
const MikroTikService = require('../services/mikrotikService');

router.post('/active-users', async (req, res) => {
  try {
    const service = new MikroTikService(req.body);
    const users = await service.getActiveUsers();

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/traffic', async (req, res) => {
  try {
    const service = new MikroTikService(req.body);
    // Prefer req.body.username but fallback to query for backward compatibility
    const username = req.body.username || req.query.username;
    const data = await service.getUserTraffic(username);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
