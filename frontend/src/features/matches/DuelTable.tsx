import { DataTable, type Column } from '../../shared/components/DataTable';
import { DuelPlayerCell } from './DuelPlayerCell';
import { duelAttributes } from './match-labels';
import type { Duel, MatchDetails } from './matches.api';
import '../players/players.css';
import './duels.css';

export function DuelTable({ match }: { match: MatchDetails }) {
  const columns: Column<Duel>[] = [
    { key: 'order', label: 'Duelo', render: (duel) => duel.order },
    {
      key: 'attacking_club',
      label: 'Clube no ataque',
      render: (duel) =>
        duel.attacking_club_id === match.home.club_id
          ? match.home.club_name
          : duel.attacking_club_id === match.away.club_id
            ? match.away.club_name
            : `Clube #${duel.attacking_club_id}`,
    },
    {
      key: 'attacker',
      label: 'Atacante',
      render: (duel) => <DuelPlayerCell player={duel.attacker} />,
    },
    {
      key: 'attack_value',
      label: 'Ataque',
      render: (duel) => (
        <span className="duel-value">
          <small>{duelAttributes[duel.attacker.attribute]}</small>
          <strong>{duel.attacker.value}</strong>
        </span>
      ),
    },
    {
      key: 'defender',
      label: 'Defensor',
      render: (duel) => <DuelPlayerCell player={duel.defender} />,
    },
    {
      key: 'defense_value',
      label: 'Defesa',
      render: (duel) => (
        <span className="duel-value">
          <small>{duelAttributes[duel.defender.attribute]}</small>
          <strong>{duel.defender.value}</strong>
        </span>
      ),
    },
    {
      key: 'goal',
      label: 'Gol',
      render: (duel) => (
        <span className="duel-goal" data-goal={duel.goal}>
          {duel.goal ? 'Gol' : 'Sem gol'}
        </span>
      ),
    },
  ];

  return (
    <section className="table-card duel-table">
      <header className="table-toolbar">
        <div>
          <h2>Os 6 duelos</h2>
          <p>
            Atacantes, defensores, condições e valores do momento da partida. Cada duelo mostra se
            houve gol.
          </p>
        </div>
      </header>
      <DataTable
        label="Duelos da partida"
        columns={columns}
        rows={match.duels}
        getRowKey={(duel) => duel.order}
        loading={false}
        onRetry={() => {}}
        emptyMessage="Os duelos desta partida não foram disponibilizados."
      />
    </section>
  );
}
