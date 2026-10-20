import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { Player } from '../../shared/api/contracts';
import { Message } from '../../shared/components/Message';
import { LineupForm } from './LineupForm';
import { lineupKey, useLineup } from './lineups.queries';
import '../players/players.css';
import './lineups.css';

export function ClubLineup({ clubId, players }: { clubId: string; players: Player[] }) {
  const query = useLineup(clubId);
  const client = useQueryClient();
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const lineup = query.data;
  const currentPlayers = players.map(
    (player) => lineup?.players.find((starter) => starter.id === player.id) ?? player,
  );

  return (
    <section
      id="club-lineup"
      role="tabpanel"
      aria-labelledby="club-lineup-tab"
      tabIndex={0}
      aria-busy={query.isFetching}
    >
      {query.isPending ? (
        <div className="table-state">
          <Message>Carregando escalação…</Message>
          <div className="skeleton" />
        </div>
      ) : query.isError ? (
        <Message tone="error" onRetry={() => void query.refetch()}>
          {query.error.message}
        </Message>
      ) : lineup ? (
        <>
          {savedSnapshot === JSON.stringify(lineup) && (
            <div className="lineup-notice">
              <Message tone="success">Escalação salva. Os titulares foram atualizados.</Message>
            </div>
          )}
          <LineupForm
            key={JSON.stringify(lineup)}
            clubId={clubId}
            lineup={lineup}
            players={currentPlayers}
            onEdit={() => setSavedSnapshot(null)}
            onSaved={(result) => {
              client.setQueryData(lineupKey(clubId), result);
              setSavedSnapshot(JSON.stringify(result));
            }}
          />
        </>
      ) : null}
    </section>
  );
}
