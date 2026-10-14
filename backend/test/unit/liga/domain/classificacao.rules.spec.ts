import { calcularClassificacao } from '../../../../src/liga/domain/classificacao.rules';

describe('classificação conforme RN21', () => {
  it('reproduz o exemplo com seis clubes e desempates por saldo, gols e nome', () => {
    const clubes = [
      { id: 1, nome: 'Águias FC' },
      { id: 2, nome: 'Delta FC' },
      { id: 3, nome: 'Gama SC' },
      { id: 4, nome: 'Épsilon EC' },
      { id: 5, nome: 'Mangue FC' },
      { id: 6, nome: 'Tubarões EC' },
    ];
    const partidas = [
      { mandanteId: 1, visitanteId: 2, golsMandante: 1, golsVisitante: 2 },
      { mandanteId: 3, visitanteId: 4, golsMandante: 2, golsVisitante: 1 },
      { mandanteId: 4, visitanteId: 1, golsMandante: 3, golsVisitante: 2 },
      { mandanteId: 2, visitanteId: 3, golsMandante: 0, golsVisitante: 1 },
    ];
    const tabela = calcularClassificacao(clubes, partidas);
    expect(
      tabela.map((c) => [c.position, c.club_id, c.points, c.goal_difference, c.goals_for]),
    ).toEqual([
      [1, 3, 6, 2, 3],
      [2, 4, 3, 0, 4],
      [3, 2, 3, 0, 2],
      [4, 5, 0, 0, 0],
      [5, 6, 0, 0, 0],
      [6, 1, 0, -2, 3],
    ]);
    expect(tabela[0]).toMatchObject({ played: 2, wins: 2, draws: 0, losses: 0, goals_against: 1 });
    expect(tabela[5]).toMatchObject({ played: 2, wins: 0, draws: 0, losses: 2, goals_against: 5 });
    expect(partidas).toHaveLength(4);
  });

  it('pontua empates e desempata nomes equivalentes pelo id', () => {
    const clubes = [
      { id: 2, nome: 'Águias FC' },
      { id: 1, nome: 'Aguias FC' },
    ];
    const tabela = calcularClassificacao(clubes, [
      { mandanteId: 1, visitanteId: 2, golsMandante: 2, golsVisitante: 2 },
    ]);
    expect(tabela.map((c) => c.club_id)).toEqual([1, 2]);
    expect(tabela[0]).toMatchObject({
      points: 1,
      draws: 1,
      played: 1,
      goals_for: 2,
      goals_against: 2,
    });
    expect(calcularClassificacao([], [])).toEqual([]);
  });
});
