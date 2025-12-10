const mqtt = require('mqtt');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function setupMqtt() {
    const url = process.env.MQTT_URL || 'mqtt://localhost:1883';
    const client = mqtt.connect(url);

    client.on('connect', () => {
        console.log('Connected to MQTT broker');
        client.subscribe('agro/+/telemetry', (err) => {
            if (err) console.error(err);
        });
    });

    client.on('message', async (topic, message) => {
        try {
            const payload = JSON.parse(message.toString());
            const parts = topic.split('/');
            const machineIdentifier = parseInt(parts[1], 10) || null;

            const { metric, value, ts } = payload;
            await pool.query(
                'INSERT INTO sensor_readings (machine_id, ts, metric, value) VALUES ($1, $2, $3, $4)',
                [machineIdentifier, ts || new Date(), metric, value]
            );

            // optional: upsert machine last_seen
            if (machineIdentifier) {
                await pool.query(
                    `INSERT INTO machines (id, name, last_seen, status)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET last_seen = EXCLUDED.last_seen`,
                    [machineIdentifier, `Machine ${machineIdentifier}`, ts || new Date(), 'online']
                );
            }

            console.log('Stored reading', machineIdentifier, metric, value);
        } catch (err) {
            console.error('Failed to handle mqtt message', err.message);
        }
    });
}

module.exports = { setupMqtt };