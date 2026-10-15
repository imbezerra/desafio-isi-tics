import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Player, Club } from '../../shared/api/contracts';
import { AppShell } from '../../shared/components/AppShell';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { Icon } from '../../shared/components/Icon';
import { Message } from '../../shared/components/Message';
import { Pagination } from '../../shared/components/Pagination';
import { formatMoney, getInitials } from '../../shared/formatters';
import { useClubs } from '../overview/overview.queries';
import { usePlayers } from './players.queries';
import { initialFilters, type PlayerFilters } from './players.api';
import { PlayerFiltersForm } from './PlayerFiltersForm';
import './players.css';

const positions = {
  GOL: 'Goleiro',
  ZAG: 'Zagueiro',
  LAT: 'Lateral',
  MEI: 'Meio-campo',
  ATA: 'Atacante',
};
const conditions = {
  APTO: { label: 'Apto', className: 'fit', icon: 'condition-fit' },
  MAL_CONDICIONADO: { label: 'Mal condicionado', className: 'unfit', icon: 'condition-unfit' },
  DOENTE: { label: 'Doente', className: 'sick', icon: 'condition-sick' },
};

function createColumns(clubs: Club[]): Column<Player>[] {
  return [
    {
      key: 'name',
      label: 'Jogador',
      render: (player) => (
        <div className="player-name">
          <span className="avatar">{getInitials(player.name)}</span>
          <span>
            {player.name}
            <small>{positions[player.position]}</small>
          </span>
        </div>
      ),
    },
    {
      key: 'position',
      label: 'Posição',
      render: (player) => <span className="position-badge">{player.position}</span>,
    },
    {
      key: 'overall',
      label: 'Overall',
      numeric: true,
      render: (player) => <strong>{player.overall}</strong>,
    },
    {
      key: 'agility',
      label: 'Agilidade',
      numeric: true,
      render: (player) => (
        <span className="agility">
          {player.agility}
          <meter
            min={0}
            max={100}
            value={player.agility}
            aria-label={`Agilidade de ${player.name}`}
          />
        </span>
      ),
    },
    { key: 'age', label: 'Idade', numeric: true, render: (player) => player.age },
    {
      key: 'condition',
      label: 'Condição',
      render: (player) => {
        const condition = conditions[player.condition];

        return (
          <span className={`condition-badge ${condition.className}`}>
            <Icon name={condition.icon} />
            {condition.label}
          </span>
        );
      },
    },
    {
      key: 'baseValue',
      label: 'Valor base',
      numeric: true,
      render: (player) => <span className="muted">{formatMoney(player.base_value)}</span>,
    },
    {
      key: 'marketValue',
      label: 'Valor de mercado',
      numeric: true,
      render: (player) => <strong>{formatMoney(player.market_value)}</strong>,
    },
    {
      key: 'club',
      label: 'Clube',
      render: (player) => {
        const club = clubs.find((item) => item.id === player.club_id);

        return player.club_id === null ? (
          <span className="free-badge">Livre</span>
        ) : club ? (
          <span title={club.name}>
            {club.acronym} · {club.name}
          </span>
        ) : (
          <span>Clube #{player.club_id}</span>
        );
      },
    },
  ];
}

export function PlayersPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const players = usePlayers(filters, page);
  const clubs = useClubs();
  const queryClient = useQueryClient();

  function applyFilters(next: PlayerFilters) {
    setFilters(next);
    setPage(1);
  }

  return (
    <AppShell
      refreshing={players.isFetching || clubs.isFetching}
      onRefresh={() => {
        void queryClient.invalidateQueries();
      }}
    >
      <header className="page-heading">
        <span className="heading-icon">
          <Icon name="heading-players" />
        </span>
        <div>
          <h1>Jogadores</h1>
          <p>Consulte os indicadores e encontre os jogadores da sua liga.</p>
        </div>
      </header>
      <PlayerFiltersForm clubs={clubs.data ?? []} onApply={applyFilters} />
      {clubs.isError && (
        <Message tone="error" onRetry={() => void clubs.refetch()}>
          {clubs.error.message}
        </Message>
      )}
      <section className="table-card" aria-label="Lista de jogadores">
        <header className="table-toolbar">
          <span>Jogadores encontrados</span>
          <span className="muted">
            {players.data ? `${players.data.meta.total_items} resultados` : 'Consulta à API'}
          </span>
        </header>
        <DataTable
          label="Jogadores"
          columns={createColumns(clubs.data ?? [])}
          rows={players.data?.data ?? []}
          getRowKey={(player) => player.id}
          loading={players.isPending}
          error={players.error?.message}
          onRetry={() => void players.refetch()}
          emptyMessage="Nenhum jogador encontrado. Tente ajustar os filtros ou cadastre jogadores na próxima etapa."
        />
        {players.data && !players.isError && (
          <Pagination
            page={players.data.meta.page}
            totalPages={players.data.meta.total_pages}
            totalItems={players.data.meta.total_items}
            limit={players.data.meta.limit}
            onChange={setPage}
            disabled={players.isFetching}
          />
        )}
      </section>
      <p className="page-note">
        Overall e valores são devolvidos pela API. A busca ignora maiúsculas, minúsculas e acentos.
      </p>
      <Message>
        Primeira etapa: consulta de jogadores. Cadastro, edição, condição, exclusão e compra serão
        adicionados nas próximas entregas.
      </Message>
    </AppShell>
  );
}
