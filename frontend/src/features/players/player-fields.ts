import type { Player, PlayerPosition } from '../../shared/api/contracts';
import type { CreatePlayerInput, EditPlayerInput } from './players.api';

export const positions: Record<PlayerPosition, string> = {
  GOL: 'Goleiro',
  ZAG: 'Zagueiro',
  LAT: 'Lateral',
  MEI: 'Meio-campo',
  ATA: 'Atacante',
};

export const conditions = {
  APTO: { label: 'Apto', className: 'fit', icon: 'condition-fit' },
  MAL_CONDICIONADO: { label: 'Mal condicionado', className: 'unfit', icon: 'condition-unfit' },
  DOENTE: { label: 'Doente', className: 'sick', icon: 'condition-sick' },
};

export const indicators = [
  { key: 'pace', label: 'Velocidade' },
  { key: 'shooting', label: 'Finalização' },
  { key: 'passing', label: 'Passe' },
  { key: 'dribbling', label: 'Drible' },
  { key: 'defending', label: 'Defesa' },
  { key: 'physical', label: 'Físico' },
  { key: 'potential', label: 'Potencial' },
] as const;

export const numericFields = [
  { key: 'age', label: 'Idade', min: 16, max: 45 },
  { key: 'agility', label: 'Agilidade', min: 1, max: 100 },
  ...indicators.map((field) => ({ ...field, min: 1, max: 99 })),
] as const;

export type NumericFieldKey = (typeof numericFields)[number]['key'];

export type PlayerFormValues = { name: string; position: PlayerPosition | '' } & Record<
  NumericFieldKey,
  string
>;

export type PlayerFormErrors = Partial<Record<keyof PlayerFormValues, string>>;

export function normalizePlayerName(value: string) {
  return value.replace(/^ +| +$/g, '').replace(/ +/g, ' ');
}

export function initialPlayerValues(player?: Player): PlayerFormValues {
  return {
    name: player?.name ?? '',
    position: player?.position ?? '',
    age: player ? String(player.age) : '',
    agility: player ? String(player.agility) : '',
    pace: player ? String(player.pace) : '',
    shooting: player ? String(player.shooting) : '',
    passing: player ? String(player.passing) : '',
    dribbling: player ? String(player.dribbling) : '',
    defending: player ? String(player.defending) : '',
    physical: player ? String(player.physical) : '',
    potential: player ? String(player.potential) : '',
  };
}

export function validatePlayerForm(values: PlayerFormValues, editing: boolean): PlayerFormErrors {
  const errors: PlayerFormErrors = {};
  const name = normalizePlayerName(values.name);

  if (!name) errors.name = 'Informe o nome.';
  else if ([...name].length < 3 || [...name].length > 100)
    errors.name = 'Use de 3 a 100 caracteres.';

  if (!values.position || !(values.position in positions)) errors.position = 'Selecione a posição.';

  for (const field of numericFields) {
    if (editing && field.key !== 'age' && field.key !== 'agility') continue;

    const raw = values[field.key];
    const value = Number(raw);

    if (raw.trim() === '') errors[field.key] = `Informe ${field.label.toLowerCase()}.`;
    else if (!Number.isInteger(value) || value < field.min || value > field.max)
      errors[field.key] = `Use um inteiro de ${field.min} a ${field.max}.`;
  }

  return errors;
}

export function toEditPlayerInput(values: PlayerFormValues): EditPlayerInput {
  return {
    name: normalizePlayerName(values.name),
    position: values.position as PlayerPosition,
    age: Number(values.age),
    agility: Number(values.agility),
  };
}

export function toCreatePlayerInput(values: PlayerFormValues): CreatePlayerInput {
  return {
    ...toEditPlayerInput(values),
    pace: Number(values.pace),
    shooting: Number(values.shooting),
    passing: Number(values.passing),
    dribbling: Number(values.dribbling),
    defending: Number(values.defending),
    physical: Number(values.physical),
    potential: Number(values.potential),
  };
}
