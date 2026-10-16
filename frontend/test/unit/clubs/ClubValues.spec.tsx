import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ClubValues } from '../../../src/features/clubs/ClubValues';
import { clubDetails } from '../../fixtures/league.fixture';

describe('Resumo financeiro reutilizável', () => {
  it('preserva a versão compacta usada no cadastro', () => {
    render(<ClubValues club={clubDetails} />);
    expect(screen.getByText('51,58')).toBeInTheDocument();
    expect(screen.getByText('222,68')).toBeInTheDocument();
    expect(screen.getByText('274,26')).toBeInTheDocument();
    expect(screen.queryByText('moedas')).not.toBeInTheDocument();
  });

  it('compõe o resumo com descrições e um cartão adicional sem recalcular valores', () => {
    render(
      <ClubValues club={{ ...clubDetails, net_worth: 98.76 }} variant="summary">
        <div>
          <dt>Elenco</dt>
          <dd>1 de 12</dd>
        </div>
      </ClubValues>,
    );

    const values = screen.getByLabelText('Valores de Águias FC devolvidos pela API');

    expect(within(values).getByText('98,76')).toBeInTheDocument();
    expect(within(values).getAllByText('moedas')).toHaveLength(3);
    expect(within(values).getByText('Só muda por compras e vendas')).toBeInTheDocument();
    expect(within(values).getByText('1 de 12')).toBeInTheDocument();
  });
});
