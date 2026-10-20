import { DataTable, type Column } from '../../../shared/components/DataTable';
import { Icon } from '../../../shared/components/Icon';
import {
  formatBrasiliaDateTime,
  formatMoney,
  formatSignedMoney,
  getInitials,
} from '../../../shared/formatters';
import type { Transaction } from './history.api';

function SignedValue({ value }: { value: number }) {
  return (
    <span className={value < 0 ? 'history-negative' : value > 0 ? 'history-positive' : ''}>
      {formatSignedMoney(value)}
    </span>
  );
}

const columns: Column<Transaction>[] = [
  {
    key: 'created_at',
    label: 'Data e hora',
    render: (transaction) => {
      const moment = formatBrasiliaDateTime(transaction.created_at);

      return (
        <time className="history-time" dateTime={transaction.created_at}>
          {moment.date} <span className="muted">{moment.time}</span>
        </time>
      );
    },
  },
  {
    key: 'type',
    label: 'Tipo',
    render: (transaction) => (
      <span className="history-type" data-type={transaction.type}>
        <Icon name={transaction.type === 'COMPRA' ? 'history-purchase' : 'history-sale'} />
        {transaction.type === 'COMPRA' ? 'Compra' : 'Venda'}
      </span>
    ),
  },
  {
    key: 'player_name',
    label: 'Jogador',
    render: (transaction) => (
      <div className="history-player">
        <span className="avatar" aria-hidden="true">
          {getInitials(transaction.player_name)}
        </span>
        <strong>{transaction.player_name}</strong>
      </div>
    ),
  },
  {
    key: 'value',
    label: 'Valor',
    numeric: true,
    render: (transaction) => formatMoney(transaction.value),
  },
  {
    key: 'fee',
    label: 'Taxa ou comissão',
    numeric: true,
    render: (transaction) => formatMoney(transaction.fee),
  },
  {
    key: 'penalty',
    label: 'Multa',
    numeric: true,
    render: (transaction) => formatMoney(transaction.penalty),
  },
  {
    key: 'profit',
    label: 'Lucro',
    numeric: true,
    render: (transaction) =>
      transaction.profit === null ? (
        <span className="muted">—</span>
      ) : (
        <SignedValue value={transaction.profit} />
      ),
  },
  {
    key: 'cash_change',
    label: 'Variação do caixa',
    numeric: true,
    render: (transaction) => (
      <strong>
        <SignedValue value={transaction.cash_change} />
      </strong>
    ),
  },
];

export function TransactionTable({
  rows,
  loading,
  error,
  onRetry,
}: {
  rows: Transaction[];
  loading: boolean;
  error?: string;
  onRetry: () => void;
}) {
  return (
    <DataTable
      label="Histórico de transações"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyMessage="Nenhuma transação encontrada com os filtros aplicados."
    />
  );
}
