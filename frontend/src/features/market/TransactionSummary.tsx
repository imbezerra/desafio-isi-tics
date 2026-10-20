import type { ReactNode } from 'react';
import './transaction-summary.css';

export interface SummaryRow {
  label: string;
  value: ReactNode;
  hint?: string;
  emphasis?: boolean;
  tone?: 'positive' | 'negative';
}

export function TransactionSummary({ label, rows }: { label: string; rows: SummaryRow[] }) {
  return (
    <dl className="transaction-summary" aria-label={label}>
      {rows.map((row) => (
        <div key={row.label} className={row.emphasis ? 'transaction-summary-total' : undefined}>
          <dt>
            {row.label}
            {row.hint && <small>{row.hint}</small>}
          </dt>
          <dd data-tone={row.tone}>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
