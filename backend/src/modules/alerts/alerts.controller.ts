import { AlertService } from './service';
import { CreateAlertDto } from './types';

interface Request<T = any> {
  userId: string;
  params?: Record<string, string>;
  body?: T;
}

export class AlertsController {
  constructor(private service: AlertService) {}

  public create(req: Request<CreateAlertDto>) {
    try {
      const alert = this.service.createAlert(req.userId, req.body!);
      return { status: 201, body: alert };
    } catch (err: any) {
      return { status: 400, message: err?.message || 'Invalid alert payload' };
    }
  }

  public list(req: Request) {
    const alerts = this.service.getAlertsByUser(req.userId);
    return { status: 200, body: alerts };
  }

  public delete(req: Request) {
    const id = req.params?.alertId || '';
    const deleted = this.service.deleteAlert(req.userId, id);
    if (!deleted) return { status: 404, message: 'Not found' };
    return { status: 204, body: {} };
  }
}
