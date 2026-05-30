// ─── Block/Unblock Device (MAC Filtering) ───────────────────────────────────
router.post('/olt/:oltId/onu/:onuId/device/:macAddress/:action', oltController.blockDevice);