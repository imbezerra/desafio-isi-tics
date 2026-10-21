import { Link, useLocation, useParams, useSearchParams } from 'react-router';
import { AppShell } from '../../shared/components/AppShell';
import { Message } from '../../shared/components/Message';
import { MatchScore } from './MatchScore';
import { DuelTable } from './DuelTable';
import { useMatch } from './matches.queries';
import type { MatchDetails } from './matches.api';
import './matches.css';

export function MatchPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const clubId = params.get('club_id') ?? '';
  const backTo = clubId ? `/matches?${new URLSearchParams({ club_id: clubId })}` : '/matches';
  const location = useLocation();
  const created = location.state as { createdMatch?: MatchDetails } | null;
  const query = useMatch(id, created?.createdMatch);

  return (
    <AppShell
      pageTitle={`Partida #${id}`}
      parentPage={{ label: 'Partidas', to: backTo }}
      refreshing={query.isFetching}
      onRefresh={() => void query.refetch()}
    >
      <header className="page-heading">
        <div>
          <h1>Partida #{id}</h1>
          <p>Placar e duelos registrados no momento do jogo.</p>
        </div>
        <Link className="button button-outline match-create" to={backTo}>
          Voltar às partidas
        </Link>
      </header>
      {query.isPending ? (
        <div className="table-state">
          <Message>Carregando partida…</Message>
          <div className="skeleton" />
        </div>
      ) : query.isError ? (
        <Message tone="error" onRetry={() => void query.refetch()}>
          {query.error.message}
        </Message>
      ) : (
        <>
          {created?.createdMatch?.id === query.data.id && (
            <Message tone="success">Partida realizada com sucesso.</Message>
          )}
          <MatchScore match={query.data} />
          <DuelTable match={query.data} />
          <p className="page-note">
            Os valores dos duelos já incluem o efeito da condição. Gol ocorre quando o ataque é
            maior que a defesa; duelo empatado não é gol. Alterações posteriores nos jogadores não
            mudam este registro.
          </p>
        </>
      )}
    </AppShell>
  );
}
