import { Prisma } from '@prisma/client';

const requiredTables = [
  {
    model: 'Player',
    table: 'jogadores',
    columns: [
      'id',
      'nome',
      'posicao',
      'agilidade',
      'idade',
      'valor_base',
      'condicao',
      'clube_id',
      'velocidade',
      'finalizacao',
      'passe',
      'drible',
      'defesa',
      'fisico',
      'potencial',
      'excluido_em',
      'criado_em',
      'atualizado_em',
    ],
  },
  {
    model: 'Club',
    table: 'clubes',
    columns: ['id', 'nome', 'nome_normalizado', 'sigla', 'caixa', 'formacao', 'criado_em'],
  },
  {
    model: 'Contract',
    table: 'contratos',
    columns: [
      'id',
      'jogador_id',
      'clube_id',
      'valor_compra',
      'fidelidade_ate',
      'situacao',
      'iniciado_em',
      'encerrado_em',
    ],
  },
  {
    model: 'Transaction',
    table: 'transacoes',
    columns: [
      'id',
      'clube_id',
      'jogador_id',
      'nome_jogador',
      'tipo',
      'valor',
      'taxa',
      'multa',
      'lucro',
      'variacao_caixa',
      'criado_em',
    ],
  },
  {
    model: 'LineupEntry',
    table: 'escalacoes',
    columns: ['clube_id', 'jogador_id', 'criado_em'],
  },
  {
    model: 'Match',
    table: 'partidas',
    columns: [
      'id',
      'mandante_id',
      'visitante_id',
      'gols_mandante',
      'gols_visitante',
      'formacao_mandante',
      'formacao_visitante',
      'jogada_em',
    ],
  },
  {
    model: 'MatchDuel',
    table: 'duelos_partida',
    columns: [
      'id',
      'partida_id',
      'ordem',
      'clube_atacante_id',
      'atacante_id',
      'defensor_id',
      'nome_atacante',
      'nome_defensor',
      'posicao_atacante',
      'posicao_defensor',
      'condicao_atacante',
      'condicao_defensor',
      'atributo_ataque',
      'atributo_defesa',
      'valor_ataque',
      'valor_defesa',
      'gol',
    ],
  },
];

describe('aliases em inglês preservam o contrato físico do banco', () => {
  it.each(requiredTables)('mapeia $model para $table com as colunas exigidas', (expected) => {
    const model = Prisma.dmmf.datamodel.models.find(
      (candidate) => candidate.name === expected.model,
    );
    expect(model?.dbName).toBe(expected.table);
    const columns = model?.fields
      .filter((field) => field.kind !== 'object')
      .map((field) => field.dbName ?? field.name);
    expect(columns?.sort()).toEqual([...expected.columns].sort());
  });

  it('preserva unicidades de clube e jogador e a chave composta da escalação', () => {
    const club = Prisma.dmmf.datamodel.models.find((model) => model.name === 'Club');
    const lineup = Prisma.dmmf.datamodel.models.find((model) => model.name === 'LineupEntry');
    expect(club?.fields.find((field) => field.name === 'normalizedName')?.isUnique).toBe(true);
    expect(club?.fields.find((field) => field.name === 'acronym')?.isUnique).toBe(true);
    expect(lineup?.fields.find((field) => field.name === 'playerId')?.isUnique).toBe(true);
    expect(lineup?.primaryKey?.fields).toEqual(['clubId', 'playerId']);
  });
});
