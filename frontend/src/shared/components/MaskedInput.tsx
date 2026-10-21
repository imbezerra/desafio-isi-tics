import type { ChangeEvent, ComponentProps, KeyboardEvent } from 'react';

const masks = {
  date: { pattern: '##/##/####', placeholder: 'DD/MM/AAAA' },
  time: { pattern: '##:##', placeholder: 'HH:MM' },
};

type MaskedInputProps = Omit<
  ComponentProps<'input'>,
  'type' | 'inputMode' | 'value' | 'defaultValue' | 'onChange' | 'maxLength'
> & {
  mask: keyof typeof masks;
  value: string;
  onValueChange: (value: string) => void;
};

function formatDigits(value: string, pattern: string) {
  const digits = value.replace(/\D/g, '');
  let formatted = '';
  let index = 0;

  for (const character of pattern) {
    if (index >= digits.length) break;

    formatted += character === '#' ? digits[index++] : character;
  }

  return formatted;
}

/** Shared date/time masks. Calendar and time validation belongs to the form. */
export function MaskedInput({ mask, value, onValueChange, onKeyDown, ...props }: MaskedInputProps) {
  const { pattern, placeholder } = masks[mask];

  function change(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const cursor = formatDigits(input.value.slice(0, input.selectionStart ?? 0), pattern).length;
    const formatted = formatDigits(input.value, pattern);

    // Update the DOM before notifying the controlled form to preserve the cursor
    // even when stripping a character leaves the form value unchanged.
    input.value = formatted;
    input.setSelectionRange(cursor, cursor);
    onValueChange(formatted);
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);

    if (event.defaultPrevented || event.currentTarget.readOnly) return;

    const input = event.currentTarget;
    const start = input.selectionStart ?? 0;

    if (start !== input.selectionEnd || event.altKey || event.ctrlKey || event.metaKey) return;

    // Skip an adjacent separator so deletion always removes a digit.
    if (event.key === 'Backspace' && start > 0 && /\D/.test(input.value[start - 1])) {
      input.setSelectionRange(start - 1, start - 1);
    } else if (
      event.key === 'Delete' &&
      start < input.value.length &&
      /\D/.test(input.value[start])
    ) {
      input.setSelectionRange(start + 1, start + 1);
    }
  }

  return (
    <input
      placeholder={placeholder}
      {...props}
      type="text"
      inputMode="numeric"
      value={value}
      onChange={change}
      onKeyDown={keyDown}
    />
  );
}
