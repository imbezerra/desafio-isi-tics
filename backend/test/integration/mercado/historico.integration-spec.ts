import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { configurarApi } from '../../../src/app.config';
import { ClubesModule } from '../../../src/clubes/clubes.module';
import { formatarDataHoraBrasilia } from '../../../src/common/parsers/date.parser';
import { PrismaModule } from '../../../src/database/prisma.module';
import { PrismaService } from '../../../src/database/prisma.service';
import { JogadoresModule } from '../../../src/jogadores/jogadores.module';
import { MercadoModule } from '../../../src/mercado/mercado.module';
import { RespostaTransacao } from '../../../src/mercado/presenters/transacao.presenter';

const urlBanco = process.env.TEST_DATABASE_URL;
if (!urlBanco || !new URL(urlBanco).pathname.endsWith('_test')) {
  throw new Error('Informe TEST_DATABASE_URL para um banco exclusivo terminado em _test.');
}

const entrada = {
  name: 'Zé "Foguete"; Lima',
  position: 'MEI',
  agility: 85,
  age: 25,
  pace: 70,
  shooting: 68,
  passing: 82,
  dribbling: 79,
  defending: 55,
  physical: 64,
  potential: 86,
};
const cabecalhoCsv = 'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n';
const resumoZerado = {
  total_spent: 0,
  total_received: 0,
  total_fees: 0,
  total_penalties: 0,
  total_profit: 0,
};
type Historico = { data: RespostaTransacao[]; summary: typeof resumoZerado };

describe('histórico e exportação com PostgreSQL real', () => {
  let app: INestApplication;
  let origem: string;
  const banco = new PrismaClient({ datasources: { db: { url: urlBanco } } });

  function requisicao(caminho: string, metodo = 'GET', corpo?: unknown) {
    return fetch(`${origem}/api/v1${caminho}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  }

  async function criarJogador() {
    const resposta = await requisicao('/players', 'POST', entrada);
    expect(resposta.status).toBe(201);
    return (await resposta.json()) as { id: number };
  }

  async function criarClube() {
    const resposta = await requisicao('/clubs', 'POST', { name: 'Águias FC', acronym: 'AGU' });
    expect(resposta.status).toBe(201);
    return (await resposta.json()) as { id: number; cash: number };
  }

  async function prepararHistorico() {
    const jogador = await criarJogador();
    const clube = await criarClube();
    expect(
      (
        await requisicao(`/players/${jogador.id}/condition`, 'PATCH', {
          condition: 'MAL_CONDICIONADO',
        })
      ).status,
    ).toBe(200);
    const fim = formatarDataHoraBrasilia(new Date(Date.now() + 40 * 86_400_000)).replace(
      /:\d\d-03:00$/,
      '-03:00',
    );
    const compra = await requisicao(`/players/${jogador.id}/buy`, 'POST', {
      club_id: clube.id,
      loyalty_until: fim,
    });
    expect(compra.status).toBe(200);
    expect(
      (await requisicao(`/players/${jogador.id}`, 'PUT', { ...entrada, name: 'Meia Nova' })).status,
    ).toBe(200);
    expect(
      (await requisicao(`/players/${jogador.id}/condition`, 'PATCH', { condition: 'APTO' })).status,
    ).toBe(200);
    const venda = await requisicao(`/players/${jogador.id}/sell`, 'POST');
    expect(venda.status).toBe(200);
    // Data igual para provar que o id decrescente desempata a ordem.
    await banco.transacao.updateMany({ data: { criadoEm: new Date('2026-11-05T19:40:00Z') } });
    return { clubeId: clube.id, jogadorId: jogador.id };
  }

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [PrismaModule, JogadoresModule, ClubesModule, MercadoModule],
    })
      .overrideProvider(PrismaService)
      .useValue(banco)
      .compile();
    app = modulo.createNestApplication({ bodyParser: false });
    configurarApi(app);
    await app.listen(0, '127.0.0.1');
    origem = await app.getUrl();
  });
  afterAll(async () => {
    await app?.close();
    await banco.$disconnect();
  });
  beforeEach(async () => {
    await banco.$executeRaw`TRUNCATE TABLE clubes, jogadores RESTART IDENTITY CASCADE`;
  });

  it('lista snapshots, ordena pelo id em empate e concilia os totais com o caixa', async () => {
    const { clubeId } = await prepararHistorico();
    const resposta = await requisicao(`/clubs/${clubeId}/transactions`);
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get('content-type')).toContain('application/json');
    const historico = (await resposta.json()) as Historico;
    expect(historico.data.map((t) => [t.type, t.player_name, t.value])).toEqual([
      ['VENDA', 'Meia Nova', 40],
      ['COMPRA', entrada.name, 37],
    ]);
    expect(historico.data[0].id).toBeGreaterThan(historico.data[1].id);
    expect(historico.summary).toEqual({
      total_spent: 38.85,
      total_received: 35.7,
      total_fees: 2.15,
      total_penalties: 4,
      total_profit: 3,
    });
    const caixa = (
      await banco.clube.findUniqueOrThrow({ where: { id: clubeId } })
    ).caixa.toNumber();
    expect(300 + historico.data.reduce((soma, t) => soma + t.cash_change, 0)).toBeCloseTo(caixa, 2);
  });

  it('combina filtros e calcula summary somente das transações filtradas', async () => {
    const { clubeId, jogadorId } = await prepararHistorico();
    const venda = await requisicao(
      `/clubs/${clubeId}/transactions?type=VENDA&player_id=${jogadorId}&extra=x`,
    );
    const historico = (await venda.json()) as Historico;
    expect(historico.data.map((t) => t.type)).toEqual(['VENDA']);
    expect(historico.summary).toEqual({
      total_spent: 0,
      total_received: 35.7,
      total_fees: 0.3,
      total_penalties: 4,
      total_profit: 3,
    });
    const ambos = await requisicao(`/clubs/${clubeId}/transactions?type=COMPRA,VENDA`);
    expect(((await ambos.json()) as Historico).data).toHaveLength(2);
    const semHistorico = await criarJogador();
    const vazia = await requisicao(`/clubs/${clubeId}/transactions?player_id=${semHistorico.id}`);
    expect(vazia.status).toBe(200);
    expect(await vazia.json()).toEqual({ data: [], summary: resumoZerado });
  });

  it('exporta UTF-8 sem BOM, nomes escapados, centavos e LF, na ordem filtrada', async () => {
    const { clubeId } = await prepararHistorico();
    const resposta = await requisicao(`/clubs/${clubeId}/transactions/export`);
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get('content-type')).toContain('text/csv');
    const bytes = Buffer.from(await resposta.arrayBuffer());
    expect(bytes[0]).toBe(0x64);
    expect(bytes[bytes.length - 1]).toBe(0x0a);
    expect(bytes.includes(0x0d)).toBe(false);
    const compraCsv =
      '2026-11-05T16:40:00-03:00;COMPRA;"Zé ""Foguete""; Lima";37,00;1,85;0,00;;-38,85\n';
    expect(bytes.toString('utf8')).toBe(
      cabecalhoCsv +
        '2026-11-05T16:40:00-03:00;VENDA;Meia Nova;40,00;0,30;4,00;3,00;35,70\n' +
        compraCsv,
    );
    const filtrado = await requisicao(`/clubs/${clubeId}/transactions/export?type=COMPRA`);
    expect(await filtrado.text()).toBe(cabecalhoCsv + compraCsv);
  });

  it('retorna histórico zerado e só cabeçalho CSV quando vazio', async () => {
    const clube = await criarClube();
    expect(await (await requisicao(`/clubs/${clube.id}/transactions`)).json()).toEqual({
      data: [],
      summary: resumoZerado,
    });
    expect(
      await (await requisicao(`/clubs/${clube.id}/transactions/export?type=VENDA`)).text(),
    ).toBe(cabecalhoCsv);
  });

  it('preserva transações de excluído, mas recusa filtro pelo jogador excluído', async () => {
    const { clubeId, jogadorId } = await prepararHistorico();
    expect((await requisicao(`/players/${jogadorId}`, 'DELETE')).status).toBe(204);
    const resposta = await requisicao(`/clubs/${clubeId}/transactions`);
    expect(((await resposta.json()) as Historico).data).toHaveLength(2);
    expect(
      (await (await requisicao(`/clubs/${clubeId}/transactions/export`)).text()).split('\n'),
    ).toHaveLength(4);
    for (const sufixo of ['', '/export']) {
      const erro = await requisicao(
        `/clubs/${clubeId}/transactions${sufixo}?player_id=${jogadorId}`,
      );
      expect(erro.status).toBe(404);
      expect(erro.headers.get('content-type')).toContain('application/json');
      expect(await erro.json()).toEqual({ message: expect.any(String) });
    }
  });

  it('responde erros de filtros e recursos em JSON também na exportação', async () => {
    const clube = await criarClube();
    for (const sufixo of ['', '/export']) {
      for (const query of ['type=', 'type=COMPRA,COMPRA', 'type=compra', 'player_id=01']) {
        const erro = await requisicao(`/clubs/${clube.id}/transactions${sufixo}?${query}`);
        expect(erro.status).toBe(400);
        expect(erro.headers.get('content-type')).toContain('application/json');
        expect(await erro.json()).toEqual({ message: expect.any(String) });
      }
      expect((await requisicao(`/clubs/999/transactions${sufixo}`)).status).toBe(404);
      expect(
        (await requisicao(`/clubs/${clube.id}/transactions${sufixo}?player_id=999`)).status,
      ).toBe(404);
    }
    expect(await banco.transacao.count()).toBe(0);
  });
});
