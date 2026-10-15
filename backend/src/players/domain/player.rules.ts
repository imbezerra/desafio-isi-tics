import { PlayerCondition } from '../../common/domain.types';
import { BusinessRuleError } from '../../common/errors/business-rule.error';

type PlayerState = { clubId: number | null; position: string; age: number; condition: string };

export function validatePlayerUpdate(
  player: PlayerState,
  newPosition: string,
  newAge: number,
): void {
  if (player.clubId !== null && newPosition !== player.position) {
    throw new BusinessRuleError('Jogador com clube não pode mudar de posição.');
  }
  if (newAge < player.age) throw new BusinessRuleError('A idade não pode diminuir.');
}

export function validateConditionTransition(
  currentCondition: string,
  newCondition: PlayerCondition,
): void {
  if (currentCondition === 'DOENTE' && newCondition === 'APTO') {
    throw new BusinessRuleError('Jogador DOENTE não pode passar direto para APTO.');
  }
}

export function validatePlayerDeletion(player: PlayerState): void {
  if (player.clubId !== null)
    throw new BusinessRuleError('Só jogadores livres podem ser excluídos.');
}
