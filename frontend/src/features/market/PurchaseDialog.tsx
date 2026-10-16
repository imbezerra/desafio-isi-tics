import { useClubs } from '../clubs/clubs.queries';
import { usePlayer } from '../players/players.queries';
import { Message } from '../../shared/components/Message';
import { Modal } from '../../shared/components/Modal';
import { PurchaseForm } from './PurchaseForm';
import type { PurchaseResult } from './purchases.api';

export function PurchaseDialog({
  playerId,
  onClose,
  onSaved,
}: {
  playerId: number;
  onClose: () => void;
  onSaved: (result: PurchaseResult) => Promise<void>;
}) {
  const player = usePlayer(playerId);
  const clubs = useClubs();

  if (player.isError || clubs.isError || !player.data || !clubs.data) {
    const failed = player.isError ? player : clubs.isError ? clubs : undefined;

    return (
      <Modal
        title="Comprar jogador"
        description="Consultando jogador e clubes na API."
        onClose={onClose}
      >
        {failed ? (
          <Message tone="error" onRetry={() => void failed.refetch()}>
            {failed.error?.message}
          </Message>
        ) : (
          <Message>Carregando jogador e clubes…</Message>
        )}
      </Modal>
    );
  }

  return (
    <PurchaseForm player={player.data} clubs={clubs.data} onClose={onClose} onSaved={onSaved} />
  );
}
