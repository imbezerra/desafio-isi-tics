import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MaskedInput } from '../../../src/shared/components/MaskedInput';

function Example({ mask }: { mask: 'date' | 'time' }) {
  const [value, setValue] = useState('');

  return <MaskedInput aria-label="Valor" mask={mask} value={value} onValueChange={setValue} />;
}

function renderInput(mask: 'date' | 'time' = 'date') {
  render(<Example mask={mask} />);

  return screen.getByRole<HTMLInputElement>('textbox', { name: 'Valor' });
}

describe('Máscaras reutilizáveis de data e hora', () => {
  it.each([
    ['date', '02032027', '02/03/2027'],
    ['date', '02/03/2027', '02/03/2027'],
    ['time', '1015', '10:15'],
    ['time', '10:15', '10:15'],
  ] as const)('formata a digitação de %s: %s', async (mask, typed, expected) => {
    const user = userEvent.setup();
    const input = renderInput(mask);

    await user.type(input, typed);
    expect(input).toHaveValue(expected);
    expect(input).toHaveAttribute('inputmode', 'numeric');
  });

  it.each([
    ['date', '02/03/2027', '02/03/2027'],
    ['date', 'abc0203202799', '02/03/2027'],
    ['time', '10:15', '10:15'],
    ['time', 'abc101599', '10:15'],
  ] as const)('formata a colagem de %s: %s', async (mask, pasted, expected) => {
    const user = userEvent.setup();
    const input = renderInput(mask);

    await user.click(input);
    await user.paste(pasted);
    expect(input).toHaveValue(expected);
  });

  it('permite substituir dia e mês sem deslocar o cursor para o fim', async () => {
    const user = userEvent.setup();
    const input = renderInput();

    await user.type(input, '02032027');
    input.setSelectionRange(0, 2);
    await user.keyboard('15');
    expect(input).toHaveValue('15/03/2027');
    expect(input.selectionStart).toBe(2);
    input.setSelectionRange(3, 5);
    await user.keyboard('12');
    expect(input).toHaveValue('15/12/2027');
    expect(input.selectionStart).toBe(5);
  });

  it('remove dígitos com Backspace junto ao separador e permite esvaziar o campo', async () => {
    const user = userEvent.setup();
    const input = renderInput();

    await user.type(input, '02032027');
    input.setSelectionRange(3, 3);
    await user.keyboard('{Backspace}');
    expect(input).toHaveValue('00/32/027');
    expect(input.selectionStart).toBe(1);
    await user.clear(input);
    expect(input).toHaveValue('');
    await user.type(input, '020');
    await user.keyboard('{Backspace}{Backspace}{Backspace}');
    expect(input).toHaveValue('');
  });

  it('remove o próximo dígito com Delete junto ao separador', async () => {
    const user = userEvent.setup();
    const input = renderInput('time');

    await user.type(input, '1015');
    input.setSelectionRange(2, 2);
    await user.keyboard('{Delete}');
    expect(input).toHaveValue('10:5');
    expect(input.selectionStart).toBe(2);
  });

  it('ignora letras sem mover o cursor para o fim', async () => {
    const user = userEvent.setup();
    const input = renderInput();

    await user.type(input, '02032027');
    input.setSelectionRange(1, 1);
    await user.keyboard('a');
    expect(input).toHaveValue('02/03/2027');
    expect(input.selectionStart).toBe(1);
  });
});
