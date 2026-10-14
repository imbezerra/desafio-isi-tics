import { ordenarClubes } from '../../../../src/clubes/domain/clubes-lista';

const clubes = [
  { id: 3, name: 'Zebra FC', acronym: 'ZFC', cash: 300, squad_value: 0, net_worth: 300 },
  { id: 2, name: 'Águias FC', acronym: 'AFC', cash: 280, squad_value: 30, net_worth: 310 },
  { id: 1, name: 'Águias FC', acronym: 'AGU', cash: 300, squad_value: 10, net_worth: 310 },
];

describe('ordenação de clubes conforme RN11', () => {
  it('ordena por nome e desempata pelo id', () => {
    expect(ordenarClubes(clubes, 'name').map((clube) => clube.id)).toEqual([1, 2, 3]);
  });

  it('ordena patrimônio e desempata por nome e id', () => {
    expect(ordenarClubes(clubes, 'net_worth_desc').map((clube) => clube.id)).toEqual([1, 2, 3]);
    expect(ordenarClubes(clubes, 'net_worth_asc').map((clube) => clube.id)).toEqual([3, 1, 2]);
  });
});
