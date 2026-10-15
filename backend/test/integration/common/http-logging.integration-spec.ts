import { ConflictException, Controller, Get, INestApplication, Logger, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { configurarApi } from '../../../src/app.config';

@Controller('logging-check')
class RegistroHttpTesteController {
  @Get()
  consultar() {
    return { ok: true };
  }

  @Post()
  recusar() {
    throw new ConflictException('Operação recusada para testar o status final.');
  }
}

describe('registro HTTP centralizado', () => {
  let app: INestApplication;
  let origem: string;
  let registrar: jest.Spied<Logger['log']>;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [RegistroHttpTesteController],
    }).compile();
    app = modulo.createNestApplication({ bodyParser: false });
    configurarApi(app);
    await app.listen(0, '127.0.0.1');
    origem = await app.getUrl();
    registrar = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterAll(async () => {
    registrar?.mockRestore();
    await app?.close();
  });

  beforeEach(() => registrar.mockClear());

  it.each([
    { metodo: 'GET', caminho: '/logging-check?segredo=nao-registrar', status: 200 },
    { metodo: 'POST', caminho: '/logging-check', corpo: '{', status: 400 },
    { metodo: 'GET', caminho: '/inexistente', status: 404 },
    { metodo: 'POST', caminho: '/logging-check', corpo: '{}', status: 409 },
    { metodo: 'OPTIONS', caminho: '/logging-check', status: 204 },
  ])('registra uma vez o status final $status de $metodo $caminho', async (caso) => {
    const resposta = await fetch(`${origem}/api/v1${caso.caminho}`, {
      method: caso.metodo,
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': caso.metodo,
      },
      body: caso.corpo,
    });
    await resposta.text();
    expect(resposta.status).toBe(caso.status);
    expect(registrar).toHaveBeenCalledTimes(1);
    const mensagem = registrar.mock.calls[0][0] as string;
    expect(mensagem).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00 /);
    expect(
      mensagem.endsWith(` ${caso.metodo} /api/v1${caso.caminho.split('?')[0]} ${caso.status}`),
    ).toBe(true);
    expect(mensagem).not.toContain('segredo');
    expect(mensagem).not.toContain('nao-registrar');
    expect(mensagem).not.toContain('Operação recusada');
    expect(mensagem).not.toContain('\n');
  });
});
