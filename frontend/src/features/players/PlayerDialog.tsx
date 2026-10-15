import type { Club, Player } from '../../shared/api/contracts';
import { Icon } from '../../shared/components/Icon';
import { Message } from '../../shared/components/Message';
import { Modal } from '../../shared/components/Modal';
import type { PlayerAction } from './PlayerActions';
import { PlayerConditionForm } from './PlayerConditionForm';
import { PlayerForm } from './PlayerForm';
import { PlayerIdentity } from './PlayerIdentity';
import { PlayerIndicators } from './PlayerIndicators';
import { PlayerResult } from './PlayerResult';
import { usePlayer } from './players.queries';

export function PlayerDialog({
  id,
  kind,
  clubs,
  onClose,
  onSelect,
  onSaved,
}: {
  id: number;
  kind: Exclude<PlayerAction, 'delete'>;
  clubs: Club[];
  onClose: () => void;
  onSelect: (kind: PlayerAction, player: Player) => void;
  onSaved: (player: Player) => Promise<void>;
}) {
  const query = usePlayer(id);
  const player = query.data;

  if (!player || query.isError)
    return (
      <Modal
        title="Carregar jogador"
        description="Buscando os dados atualizados na API."
        onClose={onClose}
      >
        {query.isError ? (
          <Message tone="error" onRetry={() => void query.refetch()}>
            {query.error.message}
          </Message>
        ) : (
          <Message>Carregando jogador…</Message>
        )}
      </Modal>
    );

  if (kind === 'edit') return <PlayerForm player={player} onClose={onClose} onSaved={onSaved} />;

  if (kind === 'condition')
    return <PlayerConditionForm player={player} onClose={onClose} onSaved={onSaved} />;

  const club = clubs.find((item) => item.id === player.club_id);

  return (
    <Modal
      title="Detalhes do jogador"
      description="Indicadores e valores devolvidos pela API."
      variant="drawer"
      onClose={onClose}
    >
      <div className="form-stack">
        <PlayerIdentity player={player} />
        <PlayerResult player={player} />
        <PlayerIndicators values={player} />
        <dl className="player-facts">
          <div>
            <dt>Idade</dt>
            <dd>{player.age} anos</dd>
          </div>
          <div>
            <dt>Agilidade</dt>
            <dd>{player.agility}</dd>
          </div>
          <div>
            <dt>Clube</dt>
            <dd>
              {player.club_id === null ? 'Livre' : (club?.name ?? `Clube #${player.club_id}`)}
            </dd>
          </div>
        </dl>
        <footer className="form-actions">
          <button className="button button-outline" onClick={() => onSelect('edit', player)}>
            <Icon name="action-edit" />
            Editar
          </button>
          <button className="button button-outline" onClick={() => onSelect('condition', player)}>
            <Icon name="action-condition" />
            Alterar condição
          </button>
        </footer>
      </div>
    </Modal>
  );
}
