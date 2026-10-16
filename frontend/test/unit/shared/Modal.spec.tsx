import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Modal } from '../../../src/shared/components/Modal';

function Example({ busy = false }: { busy?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir formulário</button>
      {open && (
        <Modal
          title="Formulário"
          description="Descrição acessível"
          busy={busy}
          onClose={() => setOpen(false)}
        >
          <input aria-label="Nome" data-initial-focus />
        </Modal>
      )}
    </>
  );
}

describe('Janela reutilizável', () => {
  it('oferece uma variante de resultado sem alterar a identificação acessível', () => {
    render(
      <Modal
        title="Resultado"
        description="Dados devolvidos pela API"
        variant="receipt"
        onClose={() => {}}
      >
        <p>Operação concluída</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Resultado' });

    expect(dialog).toHaveClass('modal-receipt');
    expect(dialog).toHaveAccessibleDescription('Dados devolvidos pela API');
  });

  it('foca a entrada, permite cancelar e devolve o foco ao botão original', async () => {
    const user = userEvent.setup();

    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Abrir formulário' }));
    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveFocus();
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription('Descrição acessível');
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir formulário' })).toHaveFocus();
  });

  it('bloqueia fechar e cancelar enquanto a operação está pendente', async () => {
    const user = userEvent.setup();

    render(<Example busy />);
    await user.click(screen.getByRole('button', { name: 'Abrir formulário' }));
    expect(screen.getByRole('button', { name: 'Fechar janela' })).toBeDisabled();
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
