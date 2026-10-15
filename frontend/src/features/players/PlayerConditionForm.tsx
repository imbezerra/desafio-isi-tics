import { useState, type FormEvent } from 'react';
import type { Player, PlayerCondition } from '../../shared/api/contracts';
import { FormActions } from '../../shared/components/FormActions';
import { Message } from '../../shared/components/Message';
import { Modal } from '../../shared/components/Modal';
import { useAction } from '../../shared/hooks/useAction';
import { conditions } from './player-fields';
import { changePlayerCondition } from './players.api';
import { PlayerIdentity } from './PlayerIdentity';

export function PlayerConditionForm({
  player,
  onClose,
  onSaved,
}: {
  player: Player;
  onClose: () => void;
  onSaved: (player: Player) => Promise<void>;
}) {
  const [condition, setCondition] = useState<PlayerCondition>(player.condition);
  const [error, setError] = useState<string>();
  const action = useAction(
    (next: PlayerCondition) => changePlayerCondition(player.id, next),
    onSaved,
  );
  const blocked = player.condition === 'DOENTE' && condition === 'APTO';

  function submit(event: FormEvent) {
    event.preventDefault();

    if (!(condition in conditions)) {
      setError('Selecione a condição.');

      return;
    }

    if (blocked) {
      setError('Jogador DOENTE não pode passar direto para APTO.');

      return;
    }

    setError(undefined);
    void action.submit(condition);
  }

  return (
    <Modal
      title="Alterar condição física"
      description="O valor de mercado será atualizado pela API. Jogador que passa a Doente sai da escalação."
      busy={action.pending}
      onClose={onClose}
    >
      <form noValidate onSubmit={submit} className="form-stack">
        <PlayerIdentity player={player} />
        <fieldset
          className="condition-options"
          disabled={action.pending}
          aria-describedby={error ? 'condition-error' : undefined}
        >
          <legend>Nova condição</legend>
          {Object.entries(conditions).map(([value, item]) => (
            <label key={value} className={condition === value ? 'selected' : ''}>
              <input
                type="radio"
                name="condition"
                value={value}
                checked={condition === value}
                required
                onChange={() => {
                  setCondition(value as PlayerCondition);
                  setError(undefined);
                }}
                aria-invalid={!!error}
              />
              <span>{item.label}</span>
              {player.condition === value && <small>Atual</small>}
            </label>
          ))}
          {error && (
            <small className="field-error" id="condition-error">
              {error}
            </small>
          )}
        </fieldset>
        {player.condition === 'DOENTE' && (
          <p className="immutable-note">
            Para voltar a Apto, primeiro altere para Mal condicionado.
          </p>
        )}
        {action.error && <Message tone="error">{action.error}</Message>}
        <FormActions pending={action.pending} onCancel={onClose} label="Salvar condição" />
      </form>
    </Modal>
  );
}
