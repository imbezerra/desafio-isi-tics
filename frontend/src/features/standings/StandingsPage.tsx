import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { AppShell } from '../../shared/components/AppShell';
import { Icon } from '../../shared/components/Icon';
import { RecentMatches } from '../matches/RecentMatches';
import { useStandings } from './standings.queries';
import { StandingsTable } from './StandingsTable';
import './standings.css';

const ordering = [
  'Mais pontos',
  'Maior saldo de gols',
  'Mais gols marcados',
  'Nome do clube, de A a Z',
];

export function StandingsPage() {
  const query = useStandings();
  const client = useQueryClient();

  return (
    <AppShell
      pageTitle="Classificação"
      section="Liga"
      refreshing={query.isFetching}
      onRefresh={() => void client.invalidateQueries()}
    >
      <header className="page-heading">
        <span className="heading-icon">
          <Icon name="heading-standings" />
        </span>
        <div>
          <h1>Classificação</h1>
          <p>Todos os clubes, com 3 pontos por vitória e 1 por empate.</p>
        </div>
        <Link className="button button-outline standings-create" to="/matches?new=1">
          <Icon name="league-create" />
          Nova partida
        </Link>
      </header>
      <div className="standings-layout">
        <StandingsTable
          rows={query.data ?? []}
          loading={query.isPending || query.isFetching}
          error={query.isError ? query.error.message : undefined}
          onRetry={() => void query.refetch()}
        />
        <aside className="standings-sidebar" aria-label="Informações da liga">
          <RecentMatches />
          <section className="table-card standings-order">
            <header>
              <h2>Ordem da tabela</h2>
              <p>Critérios de classificação, nesta ordem.</p>
            </header>
            <ol>
              {ordering.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
      <p className="page-note">
        Todos os clubes aparecem, inclusive os que ainda não jogaram, com valores zerados. Pontos,
        saldo e posição são atualizados a cada consulta.
      </p>
    </AppShell>
  );
}
