import { useState } from 'react';
import { Icon } from '../../../shared/components/Icon';
import { Message } from '../../../shared/components/Message';
import { downloadBlob } from '../../../shared/downloads';
import { useAction } from '../../../shared/hooks/useAction';
import { getHistoryCsv } from './history.api';
import { defaultHistoryFilters, getHistoryPlayers } from './history-options';
import { useHistory } from './history.queries';
import { HistoryFilters } from './HistoryFilters';
import { HistorySummary } from './HistorySummary';
import { TransactionTable } from './TransactionTable';
import './history.css';

export function ClubHistory({ clubId }: { clubId: string }) {
  const [filters, setFilters] = useState(defaultHistoryFilters);
  const [notice, setNotice] = useState('');
  const all = useHistory(clubId, defaultHistoryFilters);
  const query = useHistory(clubId, filters);
  const exporter = useAction(
    () => getHistoryCsv(clubId, filters),
    (file) => {
      downloadBlob(file, `historico-clube-${clubId}.csv`);
      setNotice('CSV exportado com os filtros aplicados.');
    },
  );
  const players = getHistoryPlayers(all.data?.data ?? []);

  return (
    <section
      id="club-history"
      role="tabpanel"
      aria-labelledby="club-history-tab"
      tabIndex={0}
      className="table-card club-history"
      aria-busy={query.isFetching}
    >
      <header className="table-toolbar">
        <div>
          <h2>Histórico de transações</h2>
          <p>
            Da mais recente para a mais antiga, com o nome e os valores do momento de cada operação.
          </p>
        </div>
        <button
          type="button"
          className="button button-outline"
          disabled={exporter.pending}
          onClick={() => {
            setNotice('');
            void exporter.submit(undefined);
          }}
        >
          <Icon name="history-export" />
          {exporter.pending ? 'Exportando…' : 'Exportar CSV'}
        </button>
      </header>
      <HistoryFilters
        value={filters}
        players={players}
        disabled={exporter.pending}
        onChange={(value) => {
          setNotice('');
          exporter.reset();
          setFilters(value);
        }}
      />
      {all.isError && query.isSuccess && (
        <Message tone="error" onRetry={() => void all.refetch()}>
          Não foi possível atualizar as opções de jogadores: {all.error.message}
        </Message>
      )}
      {exporter.error && <Message tone="error">{exporter.error}</Message>}
      {notice && <Message tone="success">{notice}</Message>}
      <TransactionTable
        rows={query.data?.data ?? []}
        loading={query.isPending || query.isFetching}
        error={query.isError ? query.error.message : undefined}
        onRetry={() => void query.refetch()}
      />
      {query.isSuccess && !query.isFetching && <HistorySummary summary={query.data.summary} />}
    </section>
  );
}
