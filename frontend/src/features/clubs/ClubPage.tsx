import { useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { AppShell } from '../../shared/components/AppShell';
import { Icon } from '../../shared/components/Icon';
import { Message } from '../../shared/components/Message';
import { useClub } from './clubs.queries';
import { ClubSquad } from './ClubSquad';
import { ClubValues } from './ClubValues';
import './clubs.css';
import './club-page.css';

export function ClubPage() {
  const { id = '' } = useParams();
  const query = useClub(id);
  const client = useQueryClient();
  const club = query.data;

  function refresh() {
    void client.invalidateQueries();
  }

  return (
    <AppShell
      pageTitle={club?.name ?? 'Clube'}
      parentPage={{ label: 'Clubes', to: '/clubs' }}
      refreshing={query.isFetching}
      onRefresh={refresh}
    >
      {query.isPending ? (
        <section className="table-state" aria-busy="true" aria-label="Consulta do clube">
          <Message>Carregando clube e elenco…</Message>
          <div className="skeleton" />
          <div className="skeleton" />
        </section>
      ) : query.isError ? (
        <section className="club-load-error" aria-label="Consulta do clube">
          <h1>Não foi possível carregar o clube</h1>
          <Message tone="error" onRetry={() => void query.refetch()}>
            {query.error.message}
          </Message>
          <Link className="button button-outline" to="/clubs">
            Voltar para clubes
          </Link>
        </section>
      ) : club ? (
        <>
          <header className="page-heading club-heading">
            <span className="club-crest" aria-hidden="true">
              {club.acronym}
            </span>
            <div>
              <h1>{club.name}</h1>
              <div className="club-heading-badges">
                <span className="club-acronym">Sigla {club.acronym}</span>
                <span className="club-acronym">
                  <Icon name="club-squad-count" />
                  {club.players.length} de 12 jogadores
                </span>
              </div>
            </div>
            <Link className="button button-primary club-create" to="/players?free=true">
              <Icon name="purchase-white" />
              Comprar jogadores
            </Link>
          </header>
          <ClubValues club={club} variant="summary">
            <div>
              <dt>
                Elenco
                <Icon name="club-summary-shirt" />
              </dt>
              <dd>{club.players.length} de 12</dd>
              <dd className="club-summary-hint">Limite de 12 jogadores</dd>
            </div>
          </ClubValues>
          <div className="club-tabs" role="tablist" aria-label="Seções do clube">
            <button
              id="club-squad-tab"
              type="button"
              role="tab"
              aria-selected="true"
              aria-controls="club-squad"
              onKeyDown={(event) => {
                if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
                  event.preventDefault();
                  event.currentTarget.focus();
                }
              }}
            >
              <Icon name="club-tab-squad" />
              Elenco <span>{club.players.length}</span>
            </button>
            <button type="button" role="tab" aria-selected="false" disabled>
              <Icon name="club-tab-lineup" />
              Escalação <small>Em breve</small>
            </button>
            <button type="button" role="tab" aria-selected="false" disabled>
              <Icon name="club-tab-history" />
              Histórico <small>Em breve</small>
            </button>
          </div>
          <ClubSquad players={club.players} onRefresh={refresh} />
          <p className="page-note">
            Valores, dias restantes e percentual de multa vêm da consulta atual à API. Datas e horas
            no horário de Brasília (UTC−3). A multa tem teto de 10,00.
          </p>
          <p className="page-note">
            Venda, escalação e histórico serão disponibilizados nas próximas etapas.
          </p>
        </>
      ) : null}
    </AppShell>
  );
}
