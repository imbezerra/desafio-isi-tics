import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PlayerFiltersForm } from '../../../src/features/players/PlayerFiltersForm';
import { initialFilters } from '../../../src/features/players/players.api';
import { club } from '../../fixtures/league.fixture';

describe('Filtros acessíveis e combináveis', () => {
  it('limpa e bloqueia o clube ao selecionar só livres', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();

    render(<PlayerFiltersForm clubs={[club]} onApply={onApply} />);
    await user.selectOptions(screen.getByLabelText('Clube'), '7');
    await user.click(screen.getByText('Vínculo, idade, valor de mercado e ordenação'));
    await user.selectOptions(screen.getByLabelText('Vínculo'), 'true');
    expect(screen.getByLabelText('Clube')).toBeDisabled();
    expect(screen.getByLabelText('Clube')).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    expect(onApply).toHaveBeenCalledWith({ ...initialFilters, free: 'true' });
  });

  it('restaura o filtro de clube ao sair de só livres', async () => {
    const user = userEvent.setup();

    render(<PlayerFiltersForm clubs={[club]} onApply={vi.fn()} />);
    await user.click(screen.getByText('Vínculo, idade, valor de mercado e ordenação'));
    await user.selectOptions(screen.getByLabelText('Vínculo'), 'true');
    await user.selectOptions(screen.getByLabelText('Vínculo'), 'false');
    expect(screen.getByLabelText('Clube')).toBeEnabled();
  });

  it('limpa todos os filtros e solicita nova consulta', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();

    render(<PlayerFiltersForm clubs={[]} onApply={onApply} />);
    await user.type(screen.getByLabelText('Buscar por nome'), 'João');
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getByLabelText('Buscar por nome')).toHaveValue('');
    expect(onApply).toHaveBeenCalledWith(initialFilters);
  });

  it.each(['name', 'value_asc', 'value_desc', 'age_asc', 'age_desc', 'position'])(
    'envia ordenação %s sem ordenar no navegador',
    async (sort) => {
      const user = userEvent.setup();
      const onApply = vi.fn();

      render(<PlayerFiltersForm clubs={[]} onApply={onApply} />);
      await user.click(screen.getByText('Vínculo, idade, valor de mercado e ordenação'));
      await user.selectOptions(screen.getByLabelText('Ordenação'), sort);
      await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
      expect(onApply).toHaveBeenCalledWith({ ...initialFilters, sort });
    },
  );
});
