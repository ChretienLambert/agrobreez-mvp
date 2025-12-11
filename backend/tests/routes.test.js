const request = require('supertest');
const express = require('express');
const routes = require('../src/routes');
const errorHandler = require('../src/middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/api', routes);
app.use(errorHandler);

describe('API Routes', () => {
    describe('GET /api/health', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin',
                    password: 'admin123'
                })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.user).toHaveProperty('username', 'admin');
            expect(response.body.data.user).toHaveProperty('role', 'admin');
        });

        it('should reject invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Invalid credentials');
        });

        it('should reject missing credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Username and password are required');
        });
    });

    describe('Protected Routes', () => {
        const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTY4MzAwMDAwMCwiZXhwIjoxNjgzMDg2NDAwfQ.test';

        it('should reject requests without token', async () => {
            const response = await request(app)
                .get('/api/machines')
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Access token required');
        });

        it('should reject invalid token', async () => {
            const response = await request(app)
                .get('/api/machines')
                .set('Authorization', 'Bearer invalidtoken')
                .expect(403);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Invalid or expired token');
        });
    });

    describe('Validation Middleware', () => {
        it('should validate machine ID parameter', async () => {
            const response = await request(app)
                .get('/api/readings/invalid')
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Invalid machine ID. Must be a valid number.');
        });

        it('should validate query parameters', async () => {
            const response = await request(app)
                .get('/api/readings/1?limit=invalid')
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Limit must be a number between 1 and 1000');
        });
    });
});
