import { Link } from 'react-router';
import type { MatchSummary } from '../../shared/api/contracts';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { Icon } from '../../shared/components/Icon';
import { formatBrasiliaDateTime } from '../../shared/formatters';
import { matchDetailPath } from './match-fields';
import { matchResults } from './match-labels';
import './match-score.css';

export function MatchHistory({
  rows,
  clubId,
  loading,
  error,
  onRetry,
}: {
  rows: MatchSummary[];
  clubId: string;
  loading: boolean;
  error?: string;
  onRetry: () => void;
}) {
  const columns: Column<MatchSummary>[] = [
    {
      key: 'played_at',
      label: 'Data e hora',
      render: (match) => {
        const played = formatBrasiliaDateTime(match.played_at);

        return (
          <time dateTime={match.played_at}>
            {played.date} <small className="muted">{played.time}</small>
          </time>
        );
      },
    },
    { key: 'home', label: 'Mandante', render: (match) => match.home.club_name },
    {
      key: 'score',
      label: 'Placar',
      render: (match) => (
        <strong className="score">
          {match.home.goals} × {match.away.goals}
        </strong>
      ),
    },
    { key: 'away', label: 'Visitante', render: (match) => match.away.club_name },
    {
      key: 'result',
      label: 'Resultado',
      render: (match) => <span className="match-result">{matchResults[match.result]}</span>,
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (match) => (
        <Link
          className="button button-outline"
          to={matchDetailPath(match.id, clubId)}
          aria-label={`Ver duelos da partida #${match.id}`}
        >
          Ver duelos
          <Icon name="match-detail" />
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      label="Histórico de partidas"
      columns={columns}
      rows={rows}
      getRowKey={(match) => match.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyMessage="Nenhuma partida encontrada com este filtro."
    />
  );
}
