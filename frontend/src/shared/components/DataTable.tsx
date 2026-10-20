import type { ReactNode } from 'react';
import { Message } from './Message';

export interface Column<T> {
  key: string;
  label: string;
  shortLabel?: string;
  render: (row: T) => ReactNode;
  numeric?: boolean;
}

export function DataTable<T>({
  label,
  columns,
  rows,
  getRowKey,
  loading,
  error,
  onRetry,
  emptyMessage,
}: {
  label: string;
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => number;
  loading: boolean;
  error?: string;
  onRetry: () => void;
  emptyMessage: string;
}) {
  if (loading)
    return (
      <div className="table-state" aria-busy="true">
        <Message>Carregando {label.toLocaleLowerCase('pt-BR')}…</Message>
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    );

  if (error)
    return (
      <div className="table-state">
        <Message tone="error" onRetry={onRetry}>
          {error}
        </Message>
      </div>
    );

  if (rows.length === 0)
    return (
      <div className="table-state">
        <Message>{emptyMessage}</Message>
      </div>
    );

  return (
    <div
      className="table-scroll"
      tabIndex={0}
      role="region"
      aria-label={`Tabela de ${label.toLocaleLowerCase('pt-BR')}`}
    >
      <table>
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={column.numeric ? 'numeric' : ''}
                aria-label={column.shortLabel ? column.label : undefined}
                title={column.shortLabel ? column.label : undefined}
              >
                {column.shortLabel ?? column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className={column.numeric ? 'numeric' : ''}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
