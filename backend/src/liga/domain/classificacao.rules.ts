import { compararNomes } from '../../common/formatters/text.formatter';

type ClubeClassificacao = { id: number; nome: string };
type PlacarClassificacao = {
  mandanteId: number;
  visitanteId: number;
  golsMandante: number;
  golsVisitante: number;
};
type LinhaClassificacao = {
  club_id: number;
  club_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
};

function registrarPlacar(linha: LinhaClassificacao, golsFeitos: number, golsSofridos: number) {
  linha.played += 1;
  linha.goals_for += golsFeitos;
  linha.goals_against += golsSofridos;
  linha.goal_difference = linha.goals_for - linha.goals_against;
  if (golsFeitos > golsSofridos) {
    linha.wins += 1;
    linha.points += 3;
  } else if (golsFeitos === golsSofridos) {
    linha.draws += 1;
    linha.points += 1;
  } else {
    linha.losses += 1;
  }
}

export function calcularClassificacao(
  clubes: ClubeClassificacao[],
  partidas: PlacarClassificacao[],
) {
  const linhas = new Map<number, LinhaClassificacao>(
    clubes.map((clube) => [
      clube.id,
      {
        club_id: clube.id,
        club_name: clube.nome,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0,
      },
    ]),
  );
  for (const partida of partidas) {
    registrarPlacar(linhas.get(partida.mandanteId)!, partida.golsMandante, partida.golsVisitante);
    registrarPlacar(linhas.get(partida.visitanteId)!, partida.golsVisitante, partida.golsMandante);
  }
  return [...linhas.values()]
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goal_difference - a.goal_difference ||
        b.goals_for - a.goals_for ||
        compararNomes(a.club_name, b.club_name) ||
        a.club_id - b.club_id,
    )
    .map((linha, indice) => ({ position: indice + 1, ...linha }));
}
