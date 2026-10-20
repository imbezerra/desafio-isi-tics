import { Link } from 'react-router';
import { Icon } from '../../shared/components/Icon';
import { Message } from '../../shared/components/Message';
import { formatBrasiliaDateTime } from '../../shared/formatters';
import { useMatches } from './matches.queries';
import './recent-matches.css';

export function RecentMatches() {
  const query = useMatches();

  return (
    <section className="recent-matches table-card">
      <header>
        <h2>Últimas partidas</h2>
        <p>Da mais recente para a mais antiga.</p>
      </header>
      <div className="recent-matches-content">
        {query.isPending ? (
          <Message>Carregando últimas partidas…</Message>
        ) : query.isError ? (
          <Message tone="error" onRetry={() => void query.refetch()}>
            {query.error.message}
          </Message>
        ) : query.data.length === 0 ? (
          <Message>Nenhuma partida registrada.</Message>
        ) : (
          query.data.slice(0, 2).map((match) => {
            const played = formatBrasiliaDateTime(match.played_at);

            return (
              <Link key={match.id} to={`/matches/${match.id}`} className="recent-match">
                <time dateTime={match.played_at}>
                  {played.date}, {played.time}
                </time>
                <span>
                  <strong data-winner={match.result === 'MANDANTE'}>{match.home.club_name}</strong>
                  <b>
                    {match.home.goals} × {match.away.goals}
                  </b>
                  <strong data-winner={match.result === 'VISITANTE'}>{match.away.club_name}</strong>
                </span>
              </Link>
            );
          })
        )}
        <Link className="button button-ghost recent-all" to="/matches">
          Ver todas as partidas
          <Icon name="league-all-matches" />
        </Link>
      </div>
    </section>
  );
}
