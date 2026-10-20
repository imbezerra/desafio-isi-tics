import { Link } from 'react-router';
import type { MatchSummary } from '../../shared/api/contracts';
import { useClubs } from '../clubs/clubs.queries';
import { Icon } from '../../shared/components/Icon';
import { formatBrasiliaDateTime } from '../../shared/formatters';
import { matchResults } from './match-labels';
import './match-score.css';

export function MatchScore({ match, detailTo }: { match: MatchSummary; detailTo?: string }) {
  const played = formatBrasiliaDateTime(match.played_at);
  const clubs = useClubs();

  return (
    <section className="match-score" aria-label="Placar da partida">
      <div className="match-team match-home">
        <div>
          <strong>{match.home.club_name}</strong>
          <small>Mandante · {match.home.formation}</small>
        </div>
        <span className="match-crest" aria-hidden="true">
          {clubs.data?.find((club) => club.id === match.home.club_id)?.acronym ??
            `#${match.home.club_id}`}
        </span>
      </div>
      <div className="match-score-center">
        <strong className="score">
          {match.home.goals} × {match.away.goals}
        </strong>
        <time dateTime={match.played_at}>
          {played.date}, {played.time}
        </time>
        <span className="match-result">{matchResults[match.result]}</span>
      </div>
      <div className="match-team">
        <span className="match-crest" aria-hidden="true">
          {clubs.data?.find((club) => club.id === match.away.club_id)?.acronym ??
            `#${match.away.club_id}`}
        </span>
        <div>
          <strong>{match.away.club_name}</strong>
          <small>Visitante · {match.away.formation}</small>
        </div>
      </div>
      {detailTo && (
        <Link className="button button-outline" to={detailTo}>
          Ver duelos
          <Icon name="match-detail" />
        </Link>
      )}
    </section>
  );
}
