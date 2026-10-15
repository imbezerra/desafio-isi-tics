import { BusinessRuleError } from '../../../../src/common/errors/business-rule.error';
import {
  validatePlayerUpdate,
  validatePlayerDeletion,
  validateConditionTransition,
} from '../../../../src/players/domain/player.rules';

const freePlayer = { clubId: null, position: 'MEI', age: 25, condition: 'APTO' };

describe('regras de jogadores independentes do HTTP e do banco', () => {
  it('permite mudar posição de jogador livre, mas não de jogador vinculado', () => {
    expect(() => validatePlayerUpdate(freePlayer, 'ATA', 25)).not.toThrow();
    expect(() => validatePlayerUpdate({ ...freePlayer, clubId: 1 }, 'ATA', 25)).toThrow(
      BusinessRuleError,
    );
  });

  it('permite aumentar ou preservar idade, mas nunca diminuí-la', () => {
    expect(() => validatePlayerUpdate(freePlayer, 'MEI', 33)).not.toThrow();
    expect(() => validatePlayerUpdate(freePlayer, 'MEI', 24)).toThrow(BusinessRuleError);
  });

  it('exige recuperação intermediária antes de passar de DOENTE para APTO', () => {
    expect(() => validateConditionTransition('DOENTE', 'APTO')).toThrow(BusinessRuleError);
    expect(() => validateConditionTransition('DOENTE', 'MAL_CONDICIONADO')).not.toThrow();
    expect(() => validateConditionTransition('MAL_CONDICIONADO', 'APTO')).not.toThrow();
  });

  it('só permite exclusão de jogador livre', () => {
    expect(() => validatePlayerDeletion(freePlayer)).not.toThrow();
    expect(() => validatePlayerDeletion({ ...freePlayer, clubId: 1 })).toThrow(BusinessRuleError);
  });
});
