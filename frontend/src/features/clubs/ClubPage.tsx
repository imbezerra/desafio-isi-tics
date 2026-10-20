import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { AppShell } from '../../shared/components/AppShell';
import { Icon } from '../../shared/components/Icon';
import { Message } from '../../shared/components/Message';
import type { SquadPlayer } from '../../shared/api/contracts';
import { SaleDialog } from '../market/SaleDialog';
import { SaleReceipt } from '../market/SaleReceipt';
import type { SaleResult } from '../market/sales.api';
import { ClubHistory } from '../market/history/ClubHistory';
import { ClubLineup } from '../lineups/ClubLineup';
import { useClub } from './clubs.queries';
import { ClubSquad } from './ClubSquad';
import { ClubValues } from './ClubValues';
import { ClubTabs, type ClubTab } from './ClubTabs';
import './clubs.css';
import './club-page.css';

export function ClubPage() {
  const { id = '' } = useParams();
  const query = useClub(id);
  const client = useQueryClient();
  const club = query.data;
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get('tab');
  const activeTab: ClubTab =
    requestedTab === 'history' || requestedTab === 'lineup' ? requestedTab : 'squad';
  const [sellingPlayer, setSellingPlayer] = useState<SquadPlayer | null>(null);
  const [sale, setSale] = useState<{ result: SaleResult; clubName: string } | null>(null);

  async function sold(result: SaleResult) {
    setSale({ result, clubName: club?.name ?? `Clube #${result.club_id}` });
    setSellingPlayer(null);
    await client.invalidateQueries();
  }

  function refresh() {
    void client.invalidateQueries();
  }

  function changeTab(tab: ClubTab) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);

        if (tab !== 'squad') next.set('tab', tab);
        else next.delete('tab');

        return next;
      },
      { replace: true },
    );
  }

  function openHistory() {
    setSale(null);
    changeTab('history');
    document.getElementById('club-history-tab')?.focus();
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
          <ClubTabs active={activeTab} squadCount={club.players.length} onChange={changeTab} />
          {activeTab === 'history' ? (
            <ClubHistory key={id} clubId={id} />
          ) : activeTab === 'lineup' ? (
            <ClubLineup key={id} clubId={id} players={club.players} />
          ) : (
            <ClubSquad players={club.players} onRefresh={refresh} onSell={setSellingPlayer} />
          )}
          <p className="page-note">
            Valores, dias restantes e percentual de multa vêm da consulta atual à API. Datas e horas
            no horário de Brasília (UTC−3). A multa tem teto de 10,00.
          </p>
          <p className="page-note">
            O histórico preserva os nomes e valores do momento de cada operação.
          </p>
        </>
      ) : null}
      {sellingPlayer && club && (
        <SaleDialog
          player={sellingPlayer}
          club={club}
          onClose={() => setSellingPlayer(null)}
          onSaved={sold}
        />
      )}
      {sale && (
        <SaleReceipt
          result={sale.result}
          clubName={sale.clubName}
          onClose={() => setSale(null)}
          onHistory={openHistory}
        />
      )}
    </AppShell>
  );
}
