import { validarEscalacao } from '../../../../src/liga/domain/escalacao.rules';
import { Formacao } from '../../../../src/liga/domain/formacoes';
import { RegraNegocioError } from '../../../../src/common/errors/regra-negocio.error';

const jogador = (posicao: string) => ({ posicao, clubeId: 1, condicao: 'APTO' });

describe('formações conforme RN19', () => {
  it.each<[Formacao, string[]]>([
    ['3-1', ['GOL', 'ZAG', 'LAT', 'LAT', 'ATA']],
    ['2-2', ['GOL', 'ZAG', 'LAT', 'ATA', 'ATA']],
    ['2-1-1', ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA']],
    ['1-2-1', ['GOL', 'LAT', 'MEI', 'MEI', 'ATA']],
  ])('aceita %s com posições correspondentes, independentemente da ordem', (formacao, posicoes) => {
    expect(() => validarEscalacao(1, formacao, posicoes.map(jogador).reverse())).not.toThrow();
  });

  it('permite MAL_CONDICIONADO e recusa DOENTE, livre e jogador de outro clube', () => {
    const titulares = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'].map(jogador);
    for (const alteracao of [{ condicao: 'DOENTE' }, { clubeId: null }, { clubeId: 2 }]) {
      expect(() =>
        validarEscalacao(1, '2-1-1', [{ ...titulares[0], ...alteracao }, ...titulares.slice(1)]),
      ).toThrow(RegraNegocioError);
    }
    expect(() =>
      validarEscalacao(1, '2-1-1', [
        { ...titulares[0], condicao: 'MAL_CONDICIONADO' },
        ...titulares.slice(1),
      ]),
    ).not.toThrow();
  });

  it.each([
    ['ATA', 'ZAG', 'LAT', 'MEI', 'ATA'],
    ['GOL', 'GOL', 'LAT', 'MEI', 'ATA'],
    ['GOL', 'MEI', 'LAT', 'MEI', 'ATA'],
    ['GOL', 'ZAG', 'LAT', 'MEI'],
  ])('recusa distribuição incompatível: %j', (...posicoes) => {
    expect(() => validarEscalacao(1, '2-1-1', posicoes.map(jogador))).toThrow(RegraNegocioError);
  });
});
