import { RegraNegocioError } from '../../../../src/common/errors/regra-negocio.error';
import {
  validarEdicaoJogador,
  validarExclusaoJogador,
  validarTransicaoCondicao,
} from '../../../../src/jogadores/domain/jogador.rules';

const livre = { clubeId: null, posicao: 'MEI', idade: 25, condicao: 'APTO' };

describe('regras de jogadores independentes do HTTP e do banco', () => {
  it('permite mudar posição de jogador livre, mas não de jogador vinculado', () => {
    expect(() => validarEdicaoJogador(livre, 'ATA', 25)).not.toThrow();
    expect(() => validarEdicaoJogador({ ...livre, clubeId: 1 }, 'ATA', 25)).toThrow(
      RegraNegocioError,
    );
  });

  it('permite aumentar ou preservar idade, mas nunca diminuí-la', () => {
    expect(() => validarEdicaoJogador(livre, 'MEI', 33)).not.toThrow();
    expect(() => validarEdicaoJogador(livre, 'MEI', 24)).toThrow(RegraNegocioError);
  });

  it('exige recuperação intermediária antes de passar de DOENTE para APTO', () => {
    expect(() => validarTransicaoCondicao('DOENTE', 'APTO')).toThrow(RegraNegocioError);
    expect(() => validarTransicaoCondicao('DOENTE', 'MAL_CONDICIONADO')).not.toThrow();
    expect(() => validarTransicaoCondicao('MAL_CONDICIONADO', 'APTO')).not.toThrow();
  });

  it('só permite exclusão de jogador livre', () => {
    expect(() => validarExclusaoJogador(livre)).not.toThrow();
    expect(() => validarExclusaoJogador({ ...livre, clubeId: 1 })).toThrow(RegraNegocioError);
  });
});
