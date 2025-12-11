const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { authenticateToken, requireRole, login } = require('./middleware/auth');
const { validateMachineId, validateReadingQuery, validateTelemetryData } = require('./middleware/validation');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Authentication routes
router.post('/auth/login', login);

// Protected routes
router.get('/machines', authenticateToken, async (req, res, next) => {
    try {
        const query = `
            SELECT id, name, last_seen, status,
                   CASE
                       WHEN last_seen > NOW() - INTERVAL '1 hour' THEN 'online'
                       WHEN last_seen > NOW() - INTERVAL '24 hours' THEN 'warning'
                       ELSE 'offline'
                   END as computed_status
            FROM machines
            ORDER BY id
        `;
        const result = await pool.query(query);
        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        next(err);
    }
});

router.get('/readings/:machineId',
    authenticateToken,
    validateMachineId,
    validateReadingQuery,
    async (req, res, next) => {
    try {
        const { machineId } = req.params;
        const { limit = 200, metric, startDate, endDate } = req.query;

        let query = 'SELECT * FROM sensor_readings WHERE machine_id = $1';
        const params = [machineId];
        let paramIndex = 2;

        if (metric) {
            query += ` AND metric = $${paramIndex}`;
            params.push(metric);
            paramIndex++;
        }

        if (startDate) {
            query += ` AND ts >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            query += ` AND ts <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        query += ` ORDER BY ts DESC LIMIT $${paramIndex}`;
        params.push(limit);

        const result = await pool.query(query, params);
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (err) {
        next(err);
    }
});

// Analytics endpoints
router.get('/analytics/machines/:machineId/summary',
    authenticateToken,
    validateMachineId,
    async (req, res, next) => {
    try {
        const { machineId } = req.params;
        const { period = '24 hours' } = req.query;

        const query = `
            SELECT
                metric,
                COUNT(*) as count,
                AVG(value) as avg_value,
                MIN(value) as min_value,
                MAX(value) as max_value,
                STDDEV(value) as stddev_value
            FROM sensor_readings
            WHERE machine_id = $1
              AND ts > NOW() - INTERVAL '${period}'
            GROUP BY metric
            ORDER BY metric
        `;

        const result = await pool.query(query, [machineId]);
        res.json({
            success: true,
            data: result.rows,
            period,
            machineId: parseInt(machineId)
        });
    } catch (err) {
        next(err);
    }
});

// Admin-only routes
router.post('/machines',
    authenticateToken,
    requireRole('admin'),
    async (req, res, next) => {
    try {
        const { name, status = 'unknown' } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Machine name is required'
            });
        }

        const result = await pool.query(
            'INSERT INTO machines (name, status) VALUES ($1, $2) RETURNING *',
            [name, status]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        next(err);
    }
});

router.get('/analytics/:machineId', async (req, res) => {
    try {
        const { machineId } = req.params;
        const query = `
            SELECT
                metric,
                COUNT(*) as count,
                AVG(value) as avg_value,
                MIN(value) as min_value,
                MAX(value) as max_value,
                STDDEV(value) as stddev_value
            FROM sensor_readings
            WHERE machine_id = $1
                AND ts >= NOW() - INTERVAL '24 hours'
            GROUP BY metric
            ORDER BY metric
        `;
        const r = await pool.query(query, [machineId]);
        res.json(r.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
