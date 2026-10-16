import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Club } from '../../shared/api/contracts';
import { AppShell } from '../../shared/components/AppShell';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { Field } from '../../shared/components/Field';
import { Icon } from '../../shared/components/Icon';
import { formatMoney } from '../../shared/formatters';
import { clubSortOptions, type ClubSort } from './clubs.api';
import { useClubs } from './clubs.queries';
import './clubs.css';

const columns: Column<Club>[] = [
  {
    key: 'name',
    label: 'Clube',
    render: (club) => (
      <div className="club-name">
        <span className="club-crest" aria-hidden="true">
          {club.acronym}
        </span>
        <strong>{club.name}</strong>
      </div>
    ),
  },
  {
    key: 'acronym',
    label: 'Sigla',
    render: (club) => <span className="club-acronym">{club.acronym}</span>,
  },
  { key: 'cash', label: 'Caixa', numeric: true, render: (club) => formatMoney(club.cash) },
  {
    key: 'squad_value',
    label: 'Valor do elenco',
    numeric: true,
    render: (club) => formatMoney(club.squad_value),
  },
  {
    key: 'net_worth',
    label: 'Patrimônio',
    numeric: true,
    render: (club) => <strong>{formatMoney(club.net_worth)}</strong>,
  },
];

export function ClubsPage() {
  const [sort, setSort] = useState<ClubSort>('name');
  const clubs = useClubs(sort);
  const queryClient = useQueryClient();

  return (
    <AppShell
      pageTitle="Clubes"
      refreshing={clubs.isFetching}
      onRefresh={() => void queryClient.invalidateQueries()}
    >
      <header className="page-heading">
        <span className="heading-icon">
          <Icon name="heading-clubs" />
        </span>
        <div>
          <h1>Clubes</h1>
          <p>
            Cada clube começa com 300,00 em caixa e sem jogadores. A liga aceita no máximo 20
            clubes.
          </p>
        </div>
      </header>
      <section className="table-card clubs-table" aria-label="Lista de clubes">
        <header className="table-toolbar club-list-toolbar">
          <div className="club-count" aria-live="polite">
            <strong>
              {clubs.data
                ? `${clubs.data.length} ${clubs.data.length === 1 ? 'clube' : 'clubes'}`
                : 'Consulta à API'}
            </strong>
            {clubs.data && <span className="club-capacity">{clubs.data.length} de 20</span>}
          </div>
          <Field id="club-sort" label="Ordenar por">
            <div className="input-icon">
              <Icon name="club-sort" />
              <select
                id="club-sort"
                value={sort}
                disabled={clubs.isFetching}
                onChange={(event) => setSort(event.target.value as ClubSort)}
              >
                {Object.entries(clubSortOptions).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </Field>
        </header>
        <DataTable
          label="Clubes"
          columns={columns}
          rows={clubs.data ?? []}
          getRowKey={(club) => club.id}
          loading={clubs.isPending}
          error={clubs.error?.message}
          onRetry={() => void clubs.refetch()}
          emptyMessage="Nenhum clube encontrado."
        />
      </section>
      <p className="page-note">
        A ordenação, o caixa, o valor do elenco e o patrimônio vêm da API.
      </p>
    </AppShell>
  );
}
