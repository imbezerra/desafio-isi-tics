import { BadRequestException } from '@nestjs/common';
import { PartidaInputPipe } from '../../../../src/liga/pipes/partidas.input';
import { ConsultaPartidasPipe } from '../../../../src/liga/pipes/partidas.query';

describe('validação de partidas', () => {
  const entrada = new PartidaInputPipe();
  const consulta = new ConsultaPartidasPipe();

  it('aceita clubes distintos e ignora campos controlados', () => {
    expect(entrada.transform({ home_club_id: 1, away_club_id: 2, goals: 10 })).toEqual({
      mandanteId: 1,
      visitanteId: 2,
    });
    expect(consulta.transform({ extra: 'x' })).toEqual({});
    expect(consulta.transform({ club_id: '2' })).toEqual({ clubeId: 2 });
  });

  it.each([
    null,
    [],
    {},
    { home_club_id: 1, away_club_id: 1 },
    { home_club_id: '1', away_club_id: 2 },
    { home_club_id: 0, away_club_id: 2 },
    { home_club_id: 1, away_club_id: 1.5 },
  ])('recusa corpo inválido: %j', (valor) => {
    expect(() => entrada.transform(valor)).toThrow(BadRequestException);
  });

  it.each(['', '01', '-1', '1.0', '1e2', ['1']])('recusa filtro inválido: %j', (club_id) => {
    expect(() => consulta.transform({ club_id })).toThrow(BadRequestException);
  });
});
