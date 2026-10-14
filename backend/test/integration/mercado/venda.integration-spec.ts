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

const urlBanco = process.env.TEST_DATABASE_URL;
if (!urlBanco || !new URL(urlBanco).pathname.endsWith('_test')) {
  throw new Error('Informe TEST_DATABASE_URL para um banco exclusivo terminado em _test.');
}

const entrada = {
  name: 'Meia Lua',
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

describe('venda de jogadores com PostgreSQL real', () => {
  let app: INestApplication;
  let origem: string;
  const banco = new PrismaClient({ datasources: { db: { url: urlBanco } } });

  async function requisicao(caminho: string, metodo = 'GET', corpo?: unknown) {
    const resposta = await fetch(`${origem}/api/v1${caminho}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
    return {
      status: resposta.status,
      dados: (await resposta.json()) as Record<string, unknown> & { id: number },
    };
  }

  async function prepararCompra(condicao = 'APTO') {
    const jogador = await requisicao('/players', 'POST', entrada);
    const clube = await requisicao('/clubs', 'POST', { name: 'Águias FC', acronym: 'AGU' });
    expect(jogador.status).toBe(201);
    expect(clube.status).toBe(201);
    await requisicao(`/players/${jogador.dados.id}/condition`, 'PATCH', { condition: condicao });
    const fim = formatarDataHoraBrasilia(new Date(Date.now() + 40 * 86_400_000)).replace(
      /:\d\d-03:00$/,
      '-03:00',
    );
    const compra = await requisicao(`/players/${jogador.dados.id}/buy`, 'POST', {
      club_id: clube.dados.id,
      loyalty_until: fim,
    });
    expect(compra.status).toBe(200);
    return { jogadorId: jogador.dados.id, clubeId: clube.dados.id, compra: compra.dados };
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

  it('vende com lucro, multa, comissão e snapshots, liberando jogador e escalação', async () => {
    const { jogadorId, clubeId } = await prepararCompra('MAL_CONDICIONADO');
    await requisicao(`/players/${jogadorId}/condition`, 'PATCH', { condition: 'APTO' });
    await requisicao(`/players/${jogadorId}`, 'PUT', { ...entrada, name: 'Novo Nome' });
    await banco.clube.update({ where: { id: clubeId }, data: { formacao: '2-1-1' } });
    await banco.escalacao.create({ data: { clubeId, jogadorId } });
    const venda = await requisicao(`/players/${jogadorId}/sell`, 'POST');
    expect(venda.status).toBe(200);
    expect(venda.dados).toMatchObject({
      club_id: clubeId,
      player_id: jogadorId,
      player_name: 'Novo Nome',
      type: 'VENDA',
      value: 40,
      fee: 0.3,
      penalty: 4,
      profit: 3,
      cash_change: 35.7,
      purchase_value: 37,
      remaining_days: 40,
      penalty_rate: 10,
      contract_status: 'RESCINDIDO',
      club_cash: 296.85,
      created_at: expect.stringMatching(/-03:00$/),
    });
    expect(
      (await banco.jogador.findUniqueOrThrow({ where: { id: jogadorId } })).clubeId,
    ).toBeNull();
    expect(await banco.escalacao.count()).toBe(0);
    expect((await banco.clube.findUniqueOrThrow({ where: { id: clubeId } })).formacao).toBe(
      '2-1-1',
    );
    const contrato = await banco.contrato.findFirstOrThrow();
    expect(contrato.situacao).toBe('RESCINDIDO');
    expect(contrato.encerradoEm).not.toBeNull();
    const transacoes = await banco.transacao.findMany({ orderBy: { id: 'asc' } });
    expect(transacoes.map((t) => t.nomeJogador)).toEqual(['Meia Lua', 'Novo Nome']);
  });

  it('encerra fidelidade cumprida sem multa e ignora até corpo JSON malformado', async () => {
    const { jogadorId } = await prepararCompra();
    await banco.contrato.updateMany({ data: { fidelidadeAte: new Date(Date.now() - 60_000) } });
    const resposta = await fetch(`${origem}/api/v1/players/${jogadorId}/sell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalido',
    });
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toMatchObject({
      penalty: 0,
      fee: 0,
      profit: 0,
      remaining_days: 0,
      penalty_rate: 0,
      contract_status: 'ENCERRADO',
      cash_change: 40,
      club_cash: 298,
    });
  });

  it('mantém prejuízo com sinal e não cobra comissão', async () => {
    const { jogadorId } = await prepararCompra();
    await requisicao(`/players/${jogadorId}/condition`, 'PATCH', { condition: 'MAL_CONDICIONADO' });
    expect((await requisicao(`/players/${jogadorId}/sell`, 'POST')).dados).toMatchObject({
      value: 37,
      purchase_value: 40,
      profit: -3,
      fee: 0,
      penalty: 3.7,
      cash_change: 33.3,
    });
  });

  it('recusa livre e excluído e impede recompra apenas pelo clube vendedor', async () => {
    expect((await requisicao('/players/999/sell', 'POST')).status).toBe(404);
    const { jogadorId, clubeId } = await prepararCompra();
    expect((await requisicao(`/players/${jogadorId}/sell`, 'POST')).status).toBe(200);
    expect((await requisicao(`/players/${jogadorId}/sell`, 'POST')).status).toBe(409);
    const fim = formatarDataHoraBrasilia(new Date(Date.now() + 86_400_000)).replace(
      /:\d\d-03:00$/,
      '-03:00',
    );
    expect(
      (
        await requisicao(`/players/${jogadorId}/buy`, 'POST', {
          club_id: clubeId,
          loyalty_until: fim,
        })
      ).status,
    ).toBe(409);
    const outro = await requisicao('/clubs', 'POST', { name: 'Delta FC', acronym: 'DFC' });
    expect(
      (
        await requisicao(`/players/${jogadorId}/buy`, 'POST', {
          club_id: outro.dados.id,
          loyalty_until: fim,
        })
      ).status,
    ).toBe(200);
    const livre = await requisicao('/players', 'POST', entrada);
    await banco.jogador.update({ where: { id: livre.dados.id }, data: { excluidoEm: new Date() } });
    expect((await requisicao(`/players/${livre.dados.id}/sell`, 'POST')).status).toBe(404);
  });

  it('desfaz todos os efeitos se a gravação de VENDA falhar', async () => {
    const { jogadorId, clubeId } = await prepararCompra();
    await banco.escalacao.create({ data: { clubeId, jogadorId } });
    await banco.$executeRaw`ALTER TABLE transacoes ADD CONSTRAINT teste_falha_venda CHECK (tipo <> 'VENDA')`;
    try {
      expect((await requisicao(`/players/${jogadorId}/sell`, 'POST')).status).toBe(500);
      expect(
        (await banco.clube.findUniqueOrThrow({ where: { id: clubeId } })).caixa.toNumber(),
      ).toBe(258);
      expect((await banco.jogador.findUniqueOrThrow({ where: { id: jogadorId } })).clubeId).toBe(
        clubeId,
      );
      expect(await banco.escalacao.count()).toBe(1);
      expect(await banco.transacao.count()).toBe(1);
      expect(await banco.contrato.findFirstOrThrow()).toMatchObject({
        situacao: 'ATIVO',
        encerradoEm: null,
      });
    } finally {
      await banco.$executeRaw`ALTER TABLE transacoes DROP CONSTRAINT teste_falha_venda`;
    }
  });
});
