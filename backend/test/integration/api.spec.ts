import request from 'supertest';
import { createServer } from '../../src/server';
import { alertDtoFactory, positionInputFactory } from '../utils/factories';

describe('API integration', () => {
  let app: ReturnType<typeof createServer>;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    app = createServer();
  });

  describe('Portfolio endpoints', () => {
    test('creates and retrieves a position', async () => {
      const position = positionInputFactory();
      const createRes = await request(app).post('/api/portfolio/positions').send(position);
      expect(createRes.status).toBe(201);
      const listRes = await request(app).get('/api/portfolio/positions');
      expect(listRes.status).toBe(200);
      expect(listRes.body.length).toBe(1);
    });

    test('returns 400 for invalid position', async () => {
      const bad = positionInputFactory({ amount: -1 });
      const res = await request(app).post('/api/portfolio/positions').send(bad);
      expect(res.status).toBe(400);
    });
  });

  describe('Alerts endpoints', () => {
    test('creates and lists alerts', async () => {
      const dto = alertDtoFactory();
      const createRes = await request(app).post('/api/alerts').send(dto);
      expect(createRes.status).toBe(201);
      const listRes = await request(app).get('/api/alerts');
      expect(listRes.status).toBe(200);
      expect(listRes.body.length).toBe(1);
    });

    test('deletes alerts', async () => {
      const dto = alertDtoFactory();
      const createRes = await request(app).post('/api/alerts').send(dto);
      const alertId = createRes.body.id;
      const delRes = await request(app).delete(`/api/alerts/${alertId}`);
      expect(delRes.status).toBe(204);
    });
  });
});
