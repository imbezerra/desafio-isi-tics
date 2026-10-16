import type { ReactNode } from 'react';
import type { Club } from '../../shared/api/contracts';
import { Icon } from '../../shared/components/Icon';
import { formatMoney } from '../../shared/formatters';
import './club-values.css';

const fields = [
  { key: 'cash', label: 'Caixa', icon: 'club-summary-cash', hint: 'Só muda por compras e vendas' },
  {
    key: 'squad_value',
    label: 'Valor do elenco',
    icon: 'club-summary-squad',
    hint: 'Soma dos valores de mercado',
  },
  {
    key: 'net_worth',
    label: 'Patrimônio',
    icon: 'club-summary-worth',
    hint: 'Caixa + valor do elenco',
  },
] as const;

export function ClubValues({
  club,
  variant = 'compact',
  children,
}: {
  club: Club;
  variant?: 'compact' | 'summary';
  children?: ReactNode;
}) {
  return (
    <dl
      className={`club-values ${variant === 'summary' ? 'club-summary' : ''}`}
      aria-label={`Valores de ${club.name} devolvidos pela API`}
    >
      {fields.map(({ key, label, icon, hint }) => (
        <div key={key}>
          <dt>
            {label}
            {variant === 'summary' && <Icon name={icon} />}
          </dt>
          <dd>
            {formatMoney(club[key])}
            {variant === 'summary' && <small className="muted">moedas</small>}
          </dd>
          {variant === 'summary' && <dd className="club-summary-hint">{hint}</dd>}
        </div>
      ))}
      {children}
    </dl>
  );
}
