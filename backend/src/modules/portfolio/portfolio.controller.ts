import { validatePositionInput, validatePositionUpdate } from './base.repository';
import { PortfolioService } from './portfolio.service';
import {
  ApiResponse,
  ErrorResponse,
  PositionInput,
  PositionUpdate,
  UserId,
} from './types';

interface Request<T = any> {
  userId: UserId;
  params?: Record<string, string>;
  body?: T;
}

export class PortfolioController {
  constructor(private service: PortfolioService) {}

  public createPosition(req: Request<PositionInput>): ApiResponse | ErrorResponse {
    try {
      validatePositionInput(req.body!);
      const created = this.service.createPosition(req.userId, req.body!);
      return { status: 201, body: created };
    } catch (err: any) {
      return { status: 400, message: err.message || 'Invalid request' };
    }
  }

  public getPositions(req: Request): ApiResponse {
    const positions = this.service.getPositionsWithMetrics(req.userId);
    return { status: 200, body: positions };
  }

  public getPosition(req: Request): ApiResponse | ErrorResponse {
    const id = req.params?.id || '';
    const position = this.service.getPosition(req.userId, id);
    if (!position) return { status: 404, message: 'Not found' };
    return { status: 200, body: position };
  }

  public updatePosition(req: Request<PositionUpdate>): ApiResponse | ErrorResponse {
    try {
      validatePositionUpdate(req.body || {});
      const id = req.params?.id || '';
      const updated = this.service.updatePosition(req.userId, id, req.body || {});
      return { status: 200, body: updated };
    } catch (err: any) {
      if (err.message === 'Position not found') {
        return { status: 404, message: 'Not found' };
      }
      return { status: 400, message: err.message || 'Invalid request' };
    }
  }

  public deletePosition(req: Request): ApiResponse {
    const id = req.params?.id || '';
    const deleted = this.service.deletePosition(req.userId, id);
    return { status: deleted ? 204 : 404, body: deleted ? {} : { message: 'Not found' } };
  }

  public getSummary(req: Request): ApiResponse {
    const summary = this.service.getPortfolioSummary(req.userId);
    return { status: 200, body: summary };
  }

  public getAllocation(req: Request): ApiResponse {
    const allocation = this.service.getPortfolioAllocation(req.userId);
    return { status: 200, body: allocation };
  }
}
