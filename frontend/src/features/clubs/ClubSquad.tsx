import type { SquadPlayer } from '../../shared/api/contracts';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { Icon } from '../../shared/components/Icon';
import { formatBrasiliaDateTime, formatMoney, getInitials } from '../../shared/formatters';
import { conditions } from '../players/player-fields';
import '../players/players.css';
import './club-squad.css';

const columns: Column<SquadPlayer>[] = [
  {
    key: 'name',
    label: 'Jogador',
    render: (player) => (
      <div className="squad-player">
        <span className="avatar" aria-hidden="true">
          {getInitials(player.name)}
        </span>
        <strong>{player.name}</strong>
      </div>
    ),
  },
  {
    key: 'position',
    label: 'Posição',
    render: (player) => <span className="position-badge">{player.position}</span>,
  },
  { key: 'overall', label: 'Overall', numeric: true, render: (player) => player.overall },
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
    key: 'market_value',
    label: 'Valor de mercado',
    numeric: true,
    render: (player) => <strong>{formatMoney(player.market_value)}</strong>,
  },
  {
    key: 'purchase_value',
    label: 'Valor de compra',
    numeric: true,
    render: (player) => (
      <span className="muted">
        {player.contract ? formatMoney(player.contract.purchase_value) : '—'}
      </span>
    ),
  },
  {
    key: 'loyalty_until',
    label: 'Fim da fidelidade',
    render: (player) => {
      if (!player.contract) return <span>Contrato indisponível</span>;

      const { date, time } = formatBrasiliaDateTime(player.contract.loyalty_until);

      return (
        <time className="contract-date" dateTime={player.contract.loyalty_until}>
          {date}
          <small className="muted">{time}</small>
        </time>
      );
    },
  },
  {
    key: 'remaining_days',
    label: 'Dias restantes',
    numeric: true,
    render: (player) => player.contract?.remaining_days ?? '—',
  },
  {
    key: 'penalty_rate',
    label: '% de multa',
    render: (player) =>
      player.contract ? (
        <span className="contract-penalty" data-rate={player.contract.penalty_rate}>
          {player.contract.penalty_rate === 0 && <Icon name="contract-fulfilled" />}
          {player.contract.penalty_rate}%
        </span>
      ) : (
        '—'
      ),
  },
];

export function ClubSquad({
  players,
  onRefresh,
  onSell,
}: {
  players: SquadPlayer[];
  onRefresh: () => void;
  onSell?: (player: SquadPlayer) => void;
}) {
  return (
    <section
      id="club-squad"
      role="tabpanel"
      aria-labelledby="club-squad-tab"
      tabIndex={0}
      className="table-card club-squad"
    >
      <header className="table-toolbar">
        <div>
          <h2>Elenco</h2>
          <p>
            Ordem por posição (GOL, ZAG, LAT, MEI, ATA), nome e id, devolvida pela API. Contrato
            calculado para uma venda agora.
          </p>
        </div>
      </header>
      <DataTable
        label="Elenco"
        columns={
          onSell
            ? [
                ...columns,
                {
                  key: 'actions',
                  label: 'Ações',
                  render: (player) => (
                    <button
                      type="button"
                      className="button button-outline squad-sell"
                      aria-label={`Vender ${player.name}`}
                      onClick={() => onSell(player)}
                    >
                      <Icon name="sale-player" />
                      Vender
                    </button>
                  ),
                },
              ]
            : columns
        }
        rows={players}
        getRowKey={(player) => player.id}
        loading={false}
        onRetry={onRefresh}
        emptyMessage="Este clube ainda não tem jogadores."
      />
    </section>
  );
}
