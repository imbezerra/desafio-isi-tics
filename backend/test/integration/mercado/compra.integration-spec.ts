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
  throw new Error(
    'Informe TEST_DATABASE_URL apontando para um banco exclusivo com nome terminado em _test.',
  );
}

const jogadorEntrada = {
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

type Resposta = Record<string, unknown> & {
  id: number;
  name: string;
  created_at: string;
  contract: Record<string, unknown>;
  players: { id: number; contract: Record<string, unknown> }[];
};

describe('compra de jogador com PostgreSQL real', () => {
  let app: INestApplication;
  let origem: string;
  const banco = new PrismaClient({ datasources: { db: { url: urlBanco } } });

  async function requisicao(caminho: string, metodo = 'GET', corpo?: unknown) {
    const resposta = await fetch(`${origem}/api/v1${caminho}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
    return { status: resposta.status, dados: (await resposta.json()) as Resposta };
  }

  async function criarJogador(alteracoes: Record<string, unknown> = {}) {
    const resposta = await requisicao('/players', 'POST', { ...jogadorEntrada, ...alteracoes });
    expect(resposta.status).toBe(201);
    return resposta.dados;
  }

  async function criarClube() {
    const resposta = await requisicao('/clubs', 'POST', { name: 'Águias FC', acronym: 'AGU' });
    expect(resposta.status).toBe(201);
    return resposta.dados;
  }

  function fimFidelidade(dias = 200) {
    return formatarDataHoraBrasilia(new Date(Date.now() + dias * 86_400_000)).replace(
      /:\d\d-03:00$/,
      '-03:00',
    );
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

  it('compra, grava contrato e transação e atualiza clube e jogador na mesma operação', async () => {
    const jogador = await criarJogador();
    const clube = await criarClube();
    const fim = fimFidelidade();
    const compra = await requisicao(`/players/${jogador.id}/buy`, 'POST', {
      club_id: clube.id,
      loyalty_until: fim,
      cash: 999,
    });
    expect(compra.status).toBe(200);
    expect(compra.dados).toMatchObject({
      club_id: clube.id,
      player_id: jogador.id,
      player_name: 'Meia Lua',
      type: 'COMPRA',
      value: 40,
      fee: 2,
      penalty: 0,
      profit: null,
      cash_change: -42,
      club_cash: 258,
      contract: { purchase_value: 40, status: 'ATIVO' },
    });
    expect(compra.dados.contract.loyalty_until).toMatch(/-03:00$/);
    expect(compra.dados.created_at).toMatch(/-03:00$/);
    expect(await banco.contrato.count()).toBe(1);
    expect(await banco.transacao.count()).toBe(1);
    expect((await banco.jogador.findUniqueOrThrow({ where: { id: jogador.id } })).clubeId).toBe(
      clube.id,
    );
    const consulta = await requisicao(`/clubs/${clube.id}`);
    expect(consulta.dados).toMatchObject({ cash: 258, squad_value: 40, net_worth: 298 });
    expect(consulta.dados.players[0].contract).toMatchObject({
      purchase_value: 40,
      remaining_days: expect.any(Number),
      penalty_rate: 20,
    });
    expect(consulta.dados.players[0].contract.loyalty_until).toMatch(/-03:00$/);
  });

  it('aceita custo igual à metade exata do caixa e recusa acima dela', async () => {
    const jogador = await criarJogador();
    const clube = await criarClube();
    await banco.clube.update({ where: { id: clube.id }, data: { caixa: '100' } });
    await banco.jogador.update({ where: { id: jogador.id }, data: { valorBase: '47.62' } });
    const compra = await requisicao(`/players/${jogador.id}/buy`, 'POST', {
      club_id: clube.id,
      loyalty_until: fimFidelidade(),
    });
    expect(compra.status).toBe(200);
    expect(compra.dados).toMatchObject({
      value: 47.62,
      fee: 2.38,
      cash_change: -50,
      club_cash: 50,
    });

    await banco.clube.update({ where: { id: clube.id }, data: { caixa: '100' } });
    const outro = await criarJogador();
    await banco.jogador.update({ where: { id: outro.id }, data: { valorBase: '48' } });
    const recusada = await requisicao(`/players/${outro.id}/buy`, 'POST', {
      club_id: clube.id,
      loyalty_until: fimFidelidade(),
    });
    expect(recusada.status).toBe(409);
    expect(await banco.contrato.count()).toBe(1);
    expect((await banco.jogador.findUniqueOrThrow({ where: { id: outro.id } })).clubeId).toBeNull();
  });

  it('usa o valor de mercado atual e devolve elenco ordenado com contratos', async () => {
    const clube = await criarClube();
    const meia = await criarJogador();
    const goleiro = await criarJogador({
      name: 'Rui Prado',
      position: 'GOL',
      age: 20,
      agility: 30,
    });
    expect(
      (
        await requisicao(`/players/${goleiro.id}/condition`, 'PATCH', {
          condition: 'MAL_CONDICIONADO',
        })
      ).status,
    ).toBe(200);
    const valorGoleiro = (await requisicao(`/players/${goleiro.id}`)).dados.market_value;
    const entrada = { club_id: clube.id, loyalty_until: fimFidelidade(40) };
    expect((await requisicao(`/players/${meia.id}/buy`, 'POST', entrada)).status).toBe(200);
    const compraGoleiro = await requisicao(`/players/${goleiro.id}/buy`, 'POST', entrada);
    expect(compraGoleiro.status).toBe(200);
    expect(compraGoleiro.dados.value).toBe(valorGoleiro);
    const consulta = await requisicao(`/clubs/${clube.id}`);
    expect(consulta.dados.players.map((jogador) => jogador.id)).toEqual([goleiro.id, meia.id]);
    expect(consulta.dados.players[0].contract).toMatchObject({
      remaining_days: 40,
      penalty_rate: 10,
    });
    expect(consulta.dados.squad_value).toBeCloseTo(40 + Number(valorGoleiro), 2);
  });

  it('recusa data inválida, clube ausente, jogador inexistente e jogador ocupado', async () => {
    const jogador = await criarJogador();
    const clube = await criarClube();
    for (const loyalty_until of [
      '2027-02-30T10:15-03:00',
      fimFidelidade(-1),
      fimFidelidade(1096),
    ]) {
      expect(
        (
          await requisicao(`/players/${jogador.id}/buy`, 'POST', {
            club_id: clube.id,
            loyalty_until,
          })
        ).status,
      ).toBe(400);
    }
    expect(
      (
        await requisicao(`/players/${jogador.id}/buy`, 'POST', {
          club_id: 0,
          loyalty_until: fimFidelidade(),
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await requisicao(`/players/${jogador.id}/buy`, 'POST', {
          club_id: 999,
          loyalty_until: fimFidelidade(),
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await requisicao('/players/999/buy', 'POST', {
          club_id: clube.id,
          loyalty_until: fimFidelidade(),
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await requisicao(`/players/${jogador.id}/buy`, 'POST', {
          club_id: clube.id,
          loyalty_until: fimFidelidade(),
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await requisicao(`/players/${jogador.id}/buy`, 'POST', {
          club_id: clube.id,
          loyalty_until: fimFidelidade(),
        })
      ).status,
    ).toBe(409);
    expect(await banco.transacao.count()).toBe(1);
  });

  it('recusa clube que já vendeu o jogador e elenco com 12 membros', async () => {
    const jogador = await criarJogador();
    const clube = await criarClube();
    await banco.transacao.create({
      data: {
        jogadorId: jogador.id,
        clubeId: clube.id,
        nomeJogador: jogador.name as string,
        tipo: 'VENDA',
        valor: '40',
        taxa: '0',
        multa: '0',
        lucro: '0',
        variacaoCaixa: '40',
      },
    });
    expect(
      (
        await requisicao(`/players/${jogador.id}/buy`, 'POST', {
          club_id: clube.id,
          loyalty_until: fimFidelidade(),
        })
      ).status,
    ).toBe(409);
    await banco.transacao.deleteMany();
    await banco.jogador.createMany({
      data: Array.from({ length: 12 }, (_, indice) => ({
        nome: `Jogador Reserva ${indice}`,
        posicao: 'ATA',
        agilidade: 70,
        idade: 25,
        valorBase: '10',
        condicao: 'APTO',
        clubeId: clube.id,
        velocidade: 50,
        finalizacao: 50,
        passe: 50,
        drible: 50,
        defesa: 50,
        fisico: 50,
        potencial: 50,
      })),
    });
    expect(
      (
        await requisicao(`/players/${jogador.id}/buy`, 'POST', {
          club_id: clube.id,
          loyalty_until: fimFidelidade(),
        })
      ).status,
    ).toBe(409);
    expect(await banco.contrato.count()).toBe(0);
  });

  it('desfaz caixa, elenco e contrato se o registro da transação falhar', async () => {
    const jogador = await criarJogador();
    const clube = await criarClube();
    await banco.$executeRaw`ALTER TABLE transacoes ADD CONSTRAINT teste_falha_compra CHECK (tipo <> 'COMPRA')`;
    try {
      const compra = await requisicao(`/players/${jogador.id}/buy`, 'POST', {
        club_id: clube.id,
        loyalty_until: fimFidelidade(),
      });
      expect(compra.status).toBe(500);
      expect(await banco.contrato.count()).toBe(0);
      expect(await banco.transacao.count()).toBe(0);
      expect(
        (await banco.clube.findUniqueOrThrow({ where: { id: clube.id } })).caixa.toNumber(),
      ).toBe(300);
      expect(
        (await banco.jogador.findUniqueOrThrow({ where: { id: jogador.id } })).clubeId,
      ).toBeNull();
    } finally {
      await banco.$executeRaw`ALTER TABLE transacoes DROP CONSTRAINT teste_falha_compra`;
    }
  });
});
