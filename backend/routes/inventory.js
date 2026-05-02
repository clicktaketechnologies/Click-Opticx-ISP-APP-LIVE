const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const admin = require('firebase-admin');

router.get('/stock', async (req, res) => {
    logger.info('[INVENTORY] Fetching stock from registry...');
    try {
        const db = admin.firestore();
        const doc = await db.collection('registry').doc('inventory').get();
        
        if (doc.exists) {
            return res.json({ success: true, stock: doc.data().items || [] });
        }
        
        // Seed if empty
        const defaultStock = [
            { id: 1, item: "MikroTik hAP ac2", quantity: 15, price: 12000, category: 'Router' },
            { id: 2, item: "ONU Huawei EG8141A5", quantity: 3, price: 4500, category: 'ONU' },
            { id: 3, item: "Fiber Cable 1000m", quantity: 5, price: 15000, category: 'Cable' }
        ];
        
        await db.collection('registry').doc('inventory').set({ items: defaultStock });
        res.json({ success: true, stock: defaultStock });
    } catch (e) {
        logger.error(`[INVENTORY] Fetch error: ${e.message}`);
        // Fallback to mock for local testing if Firestore fails
        res.json({
            success: true,
            stock: [
                { id: 1, item: "MikroTik hAP ac2 (Mock)", quantity: 15, price: 12000 },
                { id: 2, item: "ONU Huawei EG8141A5 (Mock)", quantity: 3, price: 4500 }
            ]
        });
    }
});

router.post('/add', async (req, res) => {
    const { item, quantity, price, category } = req.body;
    try {
        const db = admin.firestore();
        const docRef = db.collection('registry').doc('inventory');
        const doc = await docRef.get();
        const items = doc.exists ? doc.data().items : [];
        
        const newItem = {
            id: Date.now(),
            item,
            quantity: parseInt(quantity),
            price: parseFloat(price),
            category,
            createdAt: new Date().toISOString()
        };
        
        items.push(newItem);
        await docRef.update({ items });
        res.json({ success: true, item: newItem });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
