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
import { conditions, positions } from './player-fields';
import { PlayerActions, type PlayerAction } from './PlayerActions';
import { PlayerForm } from './PlayerForm';
import { PlayerDialog } from './PlayerDialog';
import { DeletePlayerDialog } from './DeletePlayerDialog';
import { PlayerResult } from './PlayerResult';
import './players.css';
import './player-dialogs.css';

function createColumns(
  clubs: Club[],
  onSelect: (kind: PlayerAction, player: Player) => void,
): Column<Player>[] {
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
    {
      key: 'actions',
      label: 'Ações',
      render: (player) => (
        <PlayerActions player={player} onSelect={(kind) => onSelect(kind, player)} />
      ),
    },
  ];
}

export function PlayersPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const players = usePlayers(filters, page);
  const clubs = useClubs();
  const queryClient = useQueryClient();
  const [selection, setSelection] = useState<
    { kind: PlayerAction; player: Player } | { kind: 'create' }
  >();
  const [notice, setNotice] = useState<{ message: string; player?: Player }>();

  function select(kind: PlayerAction, player: Player) {
    setSelection({ kind, player });
  }

  async function saved(player: Player) {
    queryClient.setQueryData(['player', player.id], player);
    await queryClient.invalidateQueries();
    setNotice({
      message:
        selection?.kind === 'create'
          ? `${player.name} cadastrado com sucesso.`
          : selection?.kind === 'condition'
            ? `Condição de ${player.name} atualizada com sucesso.`
            : `${player.name} atualizado com sucesso.`,
      player,
    });

    setSelection(undefined);
  }

  async function deleted() {
    if (!selection || selection.kind === 'create') return;

    queryClient.removeQueries({ queryKey: ['player', selection.player.id], exact: true });

    if (page > 1 && players.data?.data.length === 1) setPage(page - 1);
    await queryClient.invalidateQueries();
    setNotice({ message: `${selection.player.name} excluído com sucesso.` });
    setSelection(undefined);
  }

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
        <button
          className="button button-primary new-player"
          onClick={() => setSelection({ kind: 'create' })}
        >
          <Icon name="player-create" />
          Novo jogador
        </button>
      </header>
      {notice && (
        <section className="mutation-result" aria-label="Resultado da ação">
          <Message tone="success">
            {notice.message}
            <button
              className="button button-ghost"
              aria-label="Dispensar resultado"
              onClick={() => setNotice(undefined)}
            >
              Fechar
            </button>
          </Message>
          {notice.player && <PlayerResult player={notice.player} />}
          <small className="muted">
            A lista abaixo mantém os filtros aplicados. Os dados desta confirmação vieram da API.
          </small>
        </section>
      )}
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
          columns={createColumns(clubs.data ?? [], select)}
          rows={players.data?.data ?? []}
          getRowKey={(player) => player.id}
          loading={players.isPending}
          error={players.error?.message}
          onRetry={() => void players.refetch()}
          emptyMessage="Nenhum jogador encontrado. Tente ajustar os filtros ou cadastre um novo jogador."
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
      {selection?.kind === 'create' && (
        <PlayerForm onClose={() => setSelection(undefined)} onSaved={saved} />
      )}
      {selection?.kind === 'delete' && (
        <DeletePlayerDialog
          player={selection.player}
          onClose={() => setSelection(undefined)}
          onDeleted={deleted}
        />
      )}
      {selection && selection.kind !== 'create' && selection.kind !== 'delete' && (
        <PlayerDialog
          key={`${selection.kind}-${selection.player.id}`}
          id={selection.player.id}
          kind={selection.kind}
          clubs={clubs.data ?? []}
          onClose={() => setSelection(undefined)}
          onSelect={select}
          onSaved={saved}
        />
      )}
    </AppShell>
  );
}
