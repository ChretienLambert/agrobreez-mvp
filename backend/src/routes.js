const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.get('/machines', async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM machines ORDER BY id');
        res.json(r.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/readings/:machineId', async (req, res) => {
    try {
        const { machineId } = req.params;
        const r = await pool.query('SELECT * FROM sensor_readings WHERE machine_id=$1 ORDER BY ts DESC LIMIT 200', [machineId]);
        res.json(r.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;