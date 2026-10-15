import { ConflictException, Controller, Get, INestApplication, Logger, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { configureApi } from '../../../src/app.config';

@Controller('logging-check')
class HttpLoggingTestController {
  @Get()
  get() {
    return { ok: true };
  }

  @Post()
  reject() {
    throw new ConflictException('Operação recusada para testar o status final.');
  }
}

describe('registro HTTP centralizado', () => {
  let app: INestApplication;
  let origin: string;
  let recordLog: jest.Spied<Logger['log']>;

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      controllers: [HttpLoggingTestController],
    }).compile();
    app = testingModule.createNestApplication({ bodyParser: false });
    configureApi(app);
    await app.listen(0, '127.0.0.1');
    origin = await app.getUrl();
    recordLog = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterAll(async () => {
    recordLog?.mockRestore();
    await app?.close();
  });

  beforeEach(() => recordLog.mockClear());

  it.each([
    { method: 'GET', requestPath: '/logging-check?segredo=nao-registrar', status: 200 },
    { method: 'POST', requestPath: '/logging-check', body: '{', status: 400 },
    { method: 'GET', requestPath: '/inexistente', status: 404 },
    { method: 'POST', requestPath: '/logging-check', body: '{}', status: 409 },
    { method: 'OPTIONS', requestPath: '/logging-check', status: 204 },
  ])('registra uma vez o status final $status de $metodo $caminho', async (testCase) => {
    const response = await fetch(`${origin}/api/v1${testCase.requestPath}`, {
      method: testCase.method,
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': testCase.method,
      },
      body: testCase.body,
    });
    await response.text();
    expect(response.status).toBe(testCase.status);
    expect(recordLog).toHaveBeenCalledTimes(1);
    const message = recordLog.mock.calls[0][0] as string;
    expect(message).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00 /);
    expect(
      message.endsWith(
        ` ${testCase.method} /api/v1${testCase.requestPath.split('?')[0]} ${testCase.status}`,
      ),
    ).toBe(true);
    expect(message).not.toContain('segredo');
    expect(message).not.toContain('nao-registrar');
    expect(message).not.toContain('Operação recusada');
    expect(message).not.toContain('\n');
  });
});
