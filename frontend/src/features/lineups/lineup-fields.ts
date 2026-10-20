import type { Player, PlayerPosition } from '../../shared/api/contracts';
import type { Formation, Lineup } from './lineups.api';

export type Sector = 'goalkeeper' | 'defending' | 'midfield' | 'attack';

export interface LineupSlot {
  key: string;
  sector: Sector;
  label: string;
  positions: readonly PlayerPosition[];
  hint: string;
}

const sectors = {
  goalkeeper: { label: 'Goleiro', positions: ['GOL'], hint: 'GOL' },
  defending: { label: 'Defesa', positions: ['ZAG', 'LAT'], hint: 'ZAG ou LAT' },
  midfield: { label: 'Meio', positions: ['MEI'], hint: 'MEI' },
  attack: { label: 'Ataque', positions: ['ATA'], hint: 'ATA' },
} as const;

export const formations: { value: Formation; label: string; sectors: Sector[] }[] = [
  {
    value: '3-1',
    label: 'Defesa 3, ataque 1',
    sectors: ['defending', 'defending', 'defending', 'attack'],
  },
  {
    value: '2-2',
    label: 'Defesa 2, ataque 2',
    sectors: ['defending', 'defending', 'attack', 'attack'],
  },
  {
    value: '2-1-1',
    label: 'Defesa 2, meio 1, ataque 1',
    sectors: ['defending', 'defending', 'midfield', 'attack'],
  },
  {
    value: '1-2-1',
    label: 'Defesa 1, meio 2, ataque 1',
    sectors: ['defending', 'midfield', 'midfield', 'attack'],
  },
];

export function getLineupSlots(formation: Formation | ''): LineupSlot[] {
  const selected = formations.find((item) => item.value === formation) ?? formations[2];
  const sequence: Sector[] = ['goalkeeper', ...selected.sectors];

  return sequence.map((sector, index) => ({
    ...sectors[sector],
    key: `${sector}-${sequence.slice(0, index).filter((item) => item === sector).length + 1}`,
    sector,
  }));
}

export function initialLineupChoices(lineup: Lineup): Record<string, string> {
  const remaining = [...lineup.players];

  return Object.fromEntries(
    getLineupSlots(lineup.formation ?? '').map((slot) => {
      const index = remaining.findIndex((player) => slot.positions.includes(player.position));
      const player = index === -1 ? undefined : remaining.splice(index, 1)[0];

      return [slot.key, player ? String(player.id) : ''];
    }),
  );
}

export function slotPlayers(slot: LineupSlot, players: Player[]) {
  return players.filter(
    (player) => player.condition !== 'DOENTE' && slot.positions.includes(player.position),
  );
}

export function validateLineupForm(formation: Formation | '', choices: Record<string, string>) {
  const errors: Record<string, string> = {};

  if (!formation) errors.formation = 'Selecione a formação.';

  for (const slot of getLineupSlots(formation)) {
    if (!choices[slot.key])
      errors[slot.key] = `Escolha um titular para ${slot.label.toLowerCase()}.`;
  }

  return errors;
}
