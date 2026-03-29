const express = require('express');
const router = express.Router();
const OLTService = require('../services/oltService');

router.post('/test', async (req, res) => {
  try {
    const olt = new OLTService(req.body);

    await olt.connect();

    res.json({
      status: 'CONNECTED',
      message: 'OLT Connected Successfully'
    });

  } catch (err) {
    res.status(500).json(err);
  }
});

router.post('/onu', async (req, res) => {
  try {
    const olt = new OLTService(req.body);
    const data = await olt.getONUList();

    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
