import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FormActions } from '../../../src/shared/components/FormActions';

describe('Ações reutilizáveis de formulário', () => {
  it('apresenta o ícone solicitado sem mudar o nome acessível da ação', () => {
    render(
      <FormActions
        pending={false}
        onCancel={vi.fn()}
        label="Confirmar compra"
        icon="purchase-white"
      />,
    );

    const button = screen.getByRole('button', { name: 'Confirmar compra' });

    expect(button.querySelector('img')).toHaveAttribute('src', '/assets/purchase-white.svg');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('mantém o ícone destrutivo e bloqueia cancelar e enviar durante a operação', () => {
    render(
      <FormActions pending onCancel={vi.fn()} label="Excluir" destructive icon="purchase-white" />,
    );

    const button = screen.getByRole('button', { name: 'Enviando…' });

    expect(button.querySelector('img')).toHaveAttribute('src', '/assets/delete-white.svg');
    expect(button).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });

  it('aciona o cancelamento sem submeter o formulário', async () => {
    const cancel = vi.fn();
    const user = userEvent.setup();

    render(<FormActions pending={false} onCancel={cancel} label="Salvar" />);
    const button = screen.getByRole('button', { name: 'Cancelar' });

    expect(button).toHaveAttribute('type', 'button');
    await user.click(button);
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
