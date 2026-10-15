import type { Player } from '../../shared/api/contracts';
import { FormActions } from '../../shared/components/FormActions';
import { Message } from '../../shared/components/Message';
import { Modal } from '../../shared/components/Modal';
import { useAction } from '../../shared/hooks/useAction';
import { deletePlayer } from './players.api';
import { PlayerIdentity } from './PlayerIdentity';

export function DeletePlayerDialog({
  player,
  onClose,
  onDeleted,
}: {
  player: Player;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}) {
  const action = useAction(() => deletePlayer(player.id), onDeleted);

  return (
    <Modal
      title={`Excluir ${player.name}?`}
      description="O jogador sairá da lista e da busca. O histórico de transações será preservado."
      variant="small"
      busy={action.pending}
      onClose={onClose}
    >
      <form
        className="form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          void action.submit(undefined);
        }}
      >
        <PlayerIdentity player={player} />
        <p className="muted">A exclusão só é permitida enquanto o jogador estiver livre.</p>
        {action.error && <Message tone="error">{action.error}</Message>}
        <FormActions
          pending={action.pending}
          onCancel={onClose}
          label="Excluir jogador"
          destructive
        />
      </form>
    </Modal>
  );
}
