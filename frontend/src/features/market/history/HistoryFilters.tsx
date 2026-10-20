import { Field } from '../../../shared/components/Field';
import { Icon } from '../../../shared/components/Icon';
import type { HistoryFiltersValue } from './history.api';
import { historyTypes } from './history-options';

export function HistoryFilters({
  value,
  players,
  disabled,
  onChange,
}: {
  value: HistoryFiltersValue;
  players: { id: number; name: string }[];
  disabled: boolean;
  onChange: (filters: HistoryFiltersValue) => void;
}) {
  return (
    <div className="history-filters" aria-label="Filtros do histórico">
      <fieldset disabled={disabled}>
        <legend>Tipo</legend>
        {historyTypes.map((type) => (
          <label
            key={type.value}
            className="history-type-filter"
            data-checked={value.types.includes(type.value)}
          >
            <span className="history-checkbox">
              <input
                type="checkbox"
                checked={value.types.includes(type.value)}
                onChange={(event) =>
                  onChange({
                    ...value,
                    types: historyTypes
                      .filter((item) =>
                        item.value === type.value
                          ? event.target.checked
                          : value.types.includes(item.value),
                      )
                      .map((item) => item.value),
                  })
                }
              />
              {value.types.includes(type.value) && <Icon name="history-check" />}
            </span>
            {type.label}
          </label>
        ))}
      </fieldset>
      <Field id="history-player" label="Jogador do histórico">
        <div className="input-icon history-player-select">
          <Icon name="history-player" />
          <select
            id="history-player"
            value={value.playerId}
            disabled={disabled}
            onChange={(event) => onChange({ ...value, playerId: event.target.value })}
          >
            <option value="">Todos os jogadores</option>
            {value.playerId && !players.some((player) => String(player.id) === value.playerId) && (
              <option value={value.playerId}>Jogador #{value.playerId}</option>
            )}
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name} (#{player.id})
              </option>
            ))}
          </select>
          <span className="history-select-chevron">
            <Icon name="history-chevron" />
          </span>
        </div>
      </Field>
      <button
        type="button"
        className="button button-outline"
        disabled={disabled}
        onClick={() => onChange({ types: ['COMPRA', 'VENDA'], playerId: '' })}
      >
        Limpar filtros
      </button>
      {value.types.length === 0 && (
        <small className="muted">Sem tipo selecionado: exibindo todos os tipos.</small>
      )}
    </div>
  );
}
