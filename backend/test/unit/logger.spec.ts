import { logger, sanitize } from '../../src/logger';

describe('Logger', () => {
  test('masks sensitive fields', () => {
    const sanitized = sanitize({ apiKey: 'secret', nested: { password: 'p' }, keep: 'ok' });
    expect(sanitized.apiKey).toBe('***');
    expect(sanitized.nested.password).toBe('***');
    expect(sanitized.keep).toBe('ok');
  });

  test('logs structured JSON', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {} as any);
    logger.info('init', { service: 'test' });
    expect(spy).toHaveBeenCalled();
    const payload = JSON.parse((spy.mock.calls[0] as any)[0]);
    expect(payload.level).toBe('info');
    expect(payload.message).toBe('init');
    spy.mockRestore();
  });
});
