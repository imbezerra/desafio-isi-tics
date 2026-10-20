import { Link } from 'react-router';
import type { Standing } from '../../shared/api/contracts';
import { DataTable, type Column } from '../../shared/components/DataTable';
import './standings-table.css';

const numericColumns = [
  { key: 'played', label: 'Jogos', shortLabel: 'J' },
  { key: 'wins', label: 'Vitórias', shortLabel: 'V' },
  { key: 'draws', label: 'Empates', shortLabel: 'E' },
  { key: 'losses', label: 'Derrotas', shortLabel: 'D' },
  { key: 'goals_for', label: 'Gols marcados', shortLabel: 'GP' },
  { key: 'goals_against', label: 'Gols sofridos', shortLabel: 'GC' },
  { key: 'goal_difference', label: 'Saldo de gols', shortLabel: 'SG' },
  { key: 'points', label: 'Pontos', shortLabel: 'Pts' },
] as const;

const columns: Column<Standing>[] = [
  {
    key: 'position',
    label: 'Posição',
    shortLabel: '#',
    render: (row) => (
      <span className="standing-position" data-leader={row.position === 1}>
        {row.position}
      </span>
    ),
  },
  {
    key: 'club_name',
    label: 'Clube',
    render: (row) => <Link to={`/clubs/${row.club_id}`}>{row.club_name}</Link>,
  },
  ...numericColumns.map((column) => ({
    ...column,
    numeric: true,
    render: (row: Standing) =>
      column.key === 'goal_difference' && row.goal_difference > 0
        ? `+${row.goal_difference}`
        : row[column.key],
  })),
];

export function StandingsTable({
  rows,
  loading,
  error,
  onRetry,
}: {
  rows: Standing[];
  loading: boolean;
  error?: string;
  onRetry: () => void;
}) {
  return (
    <section className="table-card standings-table">
      <DataTable
        label="Classificação"
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.club_id}
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyMessage="Nenhum clube cadastrado na liga."
      />
      <p className="standings-legend">
        J: jogos · V: vitórias · E: empates · D: derrotas · GP: gols marcados · GC: gols sofridos ·
        SG: saldo de gols · Pts: pontos
      </p>
    </section>
  );
}
