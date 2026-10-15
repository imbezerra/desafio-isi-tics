import { BusinessRuleError } from '../../common/errors/business-rule.error';
import { Formation, FORMATION_SLOTS } from './formations';

type EligiblePlayer = { clubId: number | null; position: string; condition: string };

export function validateLineup(
  clubId: number,
  formation: Formation,
  players: EligiblePlayer[],
): void {
  if (players.some((player) => player.clubId !== clubId)) {
    throw new BusinessRuleError('Todos os titulares devem pertencer ao elenco do clube.');
  }
  if (players.some((player) => player.condition === 'DOENTE')) {
    throw new BusinessRuleError('Jogador DOENTE não pode ser escalado.');
  }
  const slots = FORMATION_SLOTS[formation];
  const goalkeepers = players.filter((j) => j.position === 'GOL').length;
  const defending = players.filter((j) => j.position === 'ZAG' || j.position === 'LAT').length;
  const midfield = players.filter((j) => j.position === 'MEI').length;
  const attack = players.filter((j) => j.position === 'ATA').length;
  if (
    players.length !== 5 ||
    goalkeepers !== 1 ||
    defending !== slots.defending ||
    midfield !== slots.midfield ||
    attack !== slots.attack
  ) {
    throw new BusinessRuleError('As posições dos titulares não correspondem à formação escolhida.');
  }
}
