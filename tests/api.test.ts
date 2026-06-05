import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { apiRouter } from '../src/server/api';
import cookieParser from 'cookie-parser';

// Setup Mock app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api', apiRouter);

describe('Backend API Tests', () => {

    it('should be able to reach health endpoint', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'ok');
    });

});
