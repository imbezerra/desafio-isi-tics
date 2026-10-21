import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';
import { AppShell } from '../../shared/components/AppShell';
import { Field } from '../../shared/components/Field';
import { Icon } from '../../shared/components/Icon';
import { Message } from '../../shared/components/Message';
import { useClubs } from '../clubs/clubs.queries';
import { MatchDialog } from './MatchDialog';
import { MatchScore } from './MatchScore';
import { MatchHistory } from './MatchHistory';
import { matchDetailPath } from './match-fields';
import { useMatches } from './matches.queries';
import type { MatchDetails } from './matches.api';
import './matches.css';

export function MatchesPage() {
  const [params, setParams] = useSearchParams();
  const clubId = params.get('club_id') ?? '';
  const creating = params.get('new') === '1';
  const query = useMatches(clubId);
  const clubs = useClubs();
  const client = useQueryClient();
  const navigate = useNavigate();
  const latest = query.isSuccess && !query.isFetching ? query.data[0] : undefined;

  function changeParam(name: string, value: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);

        if (value) next.set(name, value);
        else next.delete(name);

        return next;
      },
      { replace: true },
    );
  }

  async function played(result: MatchDetails) {
    void navigate(matchDetailPath(result.id, clubId), {
      replace: true,
      state: { createdMatch: result },
    });

    await Promise.all(
      ['matches', 'standings', 'overview'].map((key) =>
        client.invalidateQueries({ queryKey: [key] }),
      ),
    );
  }

  return (
    <AppShell
      pageTitle="Partidas"
      refreshing={query.isFetching}
      onRefresh={() => void client.invalidateQueries()}
    >
      <header className="page-heading">
        <span className="heading-icon">
          <Icon name="nav-matches" />
        </span>
        <div>
          <h1>Partidas</h1>
          <p>Jogue com os titulares e consulte os resultados da liga.</p>
        </div>
        <button
          className="button button-primary match-create"
          onClick={() => changeParam('new', '1')}
        >
          <Icon name="league-create" />
          Nova partida
        </button>
      </header>
      {latest && (
        <section className="latest-match">
          <h2>{clubId ? 'Última partida do filtro' : 'Última partida'}</h2>
          <MatchScore match={latest} detailTo={matchDetailPath(latest.id, clubId)} />
        </section>
      )}
      <section className="table-card match-history">
        <header className="table-toolbar">
          <div>
            <h2>Histórico de partidas</h2>
            <p>Da mais recente para a mais antiga.</p>
          </div>
          <Field id="match-club-filter" label="Filtrar por clube">
            <select
              id="match-club-filter"
              value={clubId}
              onChange={(event) => changeParam('club_id', event.target.value)}
            >
              <option value="">Todos os clubes</option>
              {clubs.data?.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
              {clubId && !clubs.data?.some((club) => String(club.id) === clubId) && (
                <option value={clubId}>Clube #{clubId}</option>
              )}
            </select>
          </Field>
        </header>
        {clubs.isError && (
          <div className="match-filter-error">
            <Message tone="error" onRetry={() => void clubs.refetch()}>
              Não foi possível carregar as opções de clubes: {clubs.error.message}
            </Message>
          </div>
        )}
        <MatchHistory
          rows={query.data ?? []}
          clubId={clubId}
          loading={query.isPending || query.isFetching}
          error={query.isError ? query.error.message : undefined}
          onRetry={() => void query.refetch()}
        />
      </section>
      <p className="page-note">
        Datas e horas no horário de Brasília (UTC−3). Os resultados e os duelos preservam os dados
        do momento da partida.
      </p>
      {creating && <MatchDialog onClose={() => changeParam('new', '')} onSaved={played} />}
    </AppShell>
  );
}
