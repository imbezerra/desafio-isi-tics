import { Icon } from '../../../shared/components/Icon';
import { formatMoney, formatSignedMoney } from '../../../shared/formatters';
import type { HistorySummaryData } from './history.api';

const fields = [
  {
    key: 'total_spent',
    label: 'Total pago em compras',
    hint: 'Valor + taxa',
    icon: 'history-spent',
  },
  {
    key: 'total_received',
    label: 'Total recebido em vendas',
    hint: 'Crédito líquido',
    icon: 'history-received',
  },
  { key: 'total_fees', label: 'Taxas e comissões', hint: 'Somadas', icon: 'history-fees' },
  { key: 'total_penalties', label: 'Multas', hint: 'Por fidelidade', icon: 'history-penalties' },
  {
    key: 'total_profit',
    label: 'Lucro total',
    hint: 'Soma dos lucros, com sinal',
    icon: 'history-profit',
  },
] as const;

export function HistorySummary({ summary }: { summary: HistorySummaryData }) {
  return (
    <dl className="history-summary" aria-label="Totais filtrados devolvidos pela API">
      {fields.map((field) => (
        <div key={field.key}>
          <dt>
            <Icon name={field.icon} />
            {field.label}
          </dt>
          <dd
            className={
              field.key === 'total_profit'
                ? summary.total_profit < 0
                  ? 'history-negative'
                  : summary.total_profit > 0
                    ? 'history-positive'
                    : ''
                : ''
            }
          >
            {field.key === 'total_profit'
              ? formatSignedMoney(summary[field.key])
              : formatMoney(summary[field.key])}
          </dd>
          <dd className="history-summary-hint">{field.hint}</dd>
        </div>
      ))}
    </dl>
  );
}
