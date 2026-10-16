import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import type { Club } from '../../shared/api/contracts';
import { AppShell } from '../../shared/components/AppShell';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { Field } from '../../shared/components/Field';
import { Icon } from '../../shared/components/Icon';
import { Message } from '../../shared/components/Message';
import { formatMoney } from '../../shared/formatters';
import { ClubForm } from './ClubForm';
import { ClubValues } from './ClubValues';
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
  {
    key: 'actions',
    label: 'Ações',
    render: (club) => (
      <Link
        className="button button-ghost club-view"
        to={`/clubs/${club.id}`}
        aria-label={`Ver clube ${club.name}`}
      >
        Ver clube
        <Icon name="club-view" />
      </Link>
    ),
  },
];

export function ClubsPage() {
  const [sort, setSort] = useState<ClubSort>('name');
  const [creating, setCreating] = useState(false);
  const [createdClub, setCreatedClub] = useState<Club>();
  const clubs = useClubs(sort);
  const queryClient = useQueryClient();

  async function saved(club: Club) {
    await queryClient.invalidateQueries();
    setCreatedClub(club);
    setCreating(false);
  }

  return (
    <AppShell
      pageTitle="Clubes"
      onCreateClub={() => setCreating(true)}
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
        <button className="button button-primary club-create" onClick={() => setCreating(true)}>
          <Icon name="player-create" />
          Novo clube
        </button>
      </header>
      {createdClub && (
        <section className="club-created" aria-label="Resultado da criação">
          <Message tone="success">
            {createdClub.name} ({createdClub.acronym}) criado com sucesso.
          </Message>
          <ClubValues club={createdClub} />
          <button className="button button-ghost" onClick={() => setCreatedClub(undefined)}>
            Dispensar resultado
          </button>
        </section>
      )}
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
          emptyMessage="Nenhum clube cadastrado. Crie o primeiro clube para começar."
        />
      </section>
      <p className="page-note">
        A ordenação, o caixa, o valor do elenco e o patrimônio vêm da API. O cadastro mantém a
        ordenação escolhida.
      </p>
      {creating && <ClubForm onClose={() => setCreating(false)} onSaved={saved} />}
    </AppShell>
  );
}
