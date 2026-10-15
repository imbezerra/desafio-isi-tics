import { describe, expect, it } from 'vitest';
import {
  initialPlayerValues,
  normalizePlayerName,
  numericFields,
  toCreatePlayerInput,
  toEditPlayerInput,
  validatePlayerForm,
} from '../../../src/features/players/player-fields';
import { player } from '../../fixtures/league.fixture';

describe('Validação de campos de jogador, sem regras calculadas da API', () => {
  it('exige os onze campos no cadastro', () => {
    expect(Object.keys(validatePlayerForm(initialPlayerValues(), false))).toHaveLength(11);
  });

  it.each(numericFields)('valida a faixa e inteiro de $key', ({ key, min, max }) => {
    const values = initialPlayerValues(player);

    for (const value of ['', String(min - 1), String(max + 1), '1.5', 'abc']) {
      expect(validatePlayerForm({ ...values, [key]: value }, false)[key]).toBeTruthy();
    }

    for (const value of [String(min), String(max)]) {
      expect(validatePlayerForm({ ...values, [key]: value }, false)[key]).toBeUndefined();
    }
  });

  it('conta pontos de código Unicode após normalizar apenas U+0020', () => {
    const values = initialPlayerValues(player);

    expect(normalizePlayerName('  João   Silva ')).toBe('João Silva');
    expect(normalizePlayerName('\tJoão\n Silva')).toBe('\tJoão\n Silva');
    expect(validatePlayerForm({ ...values, name: ' a ' }, true).name).toBeTruthy();
    expect(validatePlayerForm({ ...values, name: '𐐀'.repeat(100) }, true).name).toBeUndefined();
    expect(validatePlayerForm({ ...values, name: '𐐀'.repeat(101) }, true).name).toBeTruthy();
  });

  it('deixa regras cruzadas e formato do nome para a API', () => {
    const values = initialPlayerValues({
      ...player,
      name: 'Jogador1',
      age: 40,
      agility: 100,
      potential: 1,
    });

    expect(validatePlayerForm(values, false)).toEqual({});
  });

  it('edita somente os quatro campos permitidos e converte números', () => {
    const values = initialPlayerValues(player);

    expect(toEditPlayerInput(values)).toEqual({
      name: player.name,
      position: 'MEI',
      age: 20,
      agility: 85,
    });

    expect(Object.keys(toCreatePlayerInput(values))).toHaveLength(11);
    expect(toCreatePlayerInput(values)).not.toHaveProperty('base_value');
    expect(toCreatePlayerInput(values)).not.toHaveProperty('overall');
    expect(toCreatePlayerInput(values)).not.toHaveProperty('condition');
    expect(toCreatePlayerInput(values)).not.toHaveProperty('club_id');
  });

  it('não exige indicadores imutáveis na edição', () => {
    const values = {
      ...initialPlayerValues(),
      name: 'João Silva',
      position: 'MEI' as const,
      age: '20',
      agility: '80',
    };

    expect(validatePlayerForm(values, true)).toEqual({});
  });
});
