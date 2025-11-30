import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import { MarketDataAggregator } from './modules/market-data/aggregator.service';
import { PositionRepository } from './modules/portfolio/repository';
import { CalculationEngine } from './modules/portfolio/calculation-engine';
import { PortfolioService } from './modules/portfolio/portfolio.service';
import { PortfolioController } from './modules/portfolio/portfolio.controller';
import { HistoricalValueService } from './modules/portfolio/historical-value.service';
import { AlertService } from './modules/alerts/service';
import { AlertRepository } from './modules/alerts/repository';
import { AlertsController } from './modules/alerts/alerts.controller';
import { logger, logInitialization } from './logger';

export function createServer() {
  const app = express();
  app.use(bodyParser.json());

  // Stub authentication middleware: extracts user ID from header or defaults to demo user
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as any).userId = req.header('x-user-id') || 'demo-user';
    next();
  });

  const marketAggregator = new MarketDataAggregator({ strictSymbols: false });
  const repository = new PositionRepository();
  const calculator = new CalculationEngine({
    getCurrentTicker: (symbol: string) => marketAggregator.getCurrentTicker(symbol),
  });
  const portfolioService = new PortfolioService(repository, calculator);
  const controller = new PortfolioController(portfolioService);
  const historicalService = new HistoricalValueService(repository, { getCurrentTicker: (symbol: string) => marketAggregator.getCurrentTicker(symbol) });
  const alertRepo = new AlertRepository();
  const alertService = new AlertService(alertRepo);
  const alertsController = new AlertsController(alertService);

  // Portfolio API
  app.post('/api/portfolio/positions', (req, res) => {
    const response = controller.createPosition({ userId: (req as any).userId, body: req.body });
    res.status((response as any).status).json('body' in response ? response.body : { message: (response as any).message });
  });

  app.get('/api/portfolio/positions', (req, res) => {
    const response = controller.getPositions({ userId: (req as any).userId });
    res.status(response.status).json(response.body);
  });

  app.get('/api/portfolio/positions/:id', (req, res) => {
    const response = controller.getPosition({ userId: (req as any).userId, params: req.params });
    if ('body' in response) return res.status(response.status).json(response.body);
    return res.status(response.status).json({ message: (response as any).message });
  });

  app.put('/api/portfolio/positions/:id', (req, res) => {
    const response = controller.updatePosition({ userId: (req as any).userId, params: req.params, body: req.body });
    if ('body' in response) return res.status(response.status).json(response.body);
    return res.status(response.status).json({ message: (response as any).message });
  });

  app.delete('/api/portfolio/positions/:id', (req, res) => {
    const response = controller.deletePosition({ userId: (req as any).userId, params: req.params });
    res.status(response.status).json(response.body);
  });

  app.get('/api/portfolio/summary', (req, res) => {
    const response = controller.getSummary({ userId: (req as any).userId });
    res.status(response.status).json(response.body);
  });

  app.get('/api/portfolio/allocation', (req, res) => {
    const response = controller.getAllocation({ userId: (req as any).userId });
    res.status(response.status).json(response.body);
  });

  app.get('/api/portfolio/history', async (req, res) => {
    try {
      const start = Number(req.query.start || 0);
      const end = Number(req.query.end || Date.now());
      const interval = Number(req.query.interval || 60);
      const data = await historicalService.getPortfolioHistory((req as any).userId, start, end, interval);
      res.status(200).json(data);
    } catch (err: any) {
      res.status(400).json({ message: err?.message || 'Failed to fetch history' });
    }
  });

  // Alerts API
  app.post('/api/alerts', (req, res) => {
    const response = alertsController.create({ userId: (req as any).userId, body: req.body });
    if ('body' in response) return res.status(response.status).json(response.body);
    return res.status(response.status).json({ message: (response as any).message });
  });

  app.get('/api/alerts', (req, res) => {
    const response = alertsController.list({ userId: (req as any).userId });
    res.status(response.status).json(response.body);
  });

  app.delete('/api/alerts/:alertId', (req, res) => {
    const response = alertsController.delete({ userId: (req as any).userId, params: req.params });
    if ('body' in response) return res.status(response.status).json(response.body);
    return res.status(response.status).json({ message: (response as any).message });
  });

  // Default error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error', err);
    res.status(500).json({ message: 'Internal server error' });
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const app = createServer();
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    logInitialization('Portfolio API listening');
  });
}
