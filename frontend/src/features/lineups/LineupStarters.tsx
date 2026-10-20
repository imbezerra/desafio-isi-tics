import type { Player } from '../../shared/api/contracts';
import { Field } from '../../shared/components/Field';
import { Icon } from '../../shared/components/Icon';
import { conditions } from '../players/player-fields';
import { slotPlayers, type LineupSlot } from './lineup-fields';
import './lineup-starters.css';

export function LineupStarters({
  slots,
  choices,
  players,
  errors,
  onChange,
}: {
  slots: LineupSlot[];
  choices: Record<string, string>;
  players: Player[];
  errors: Record<string, string>;
  onChange: (slot: string, id: string) => void;
}) {
  const selectedIds = Object.values(choices);

  return (
    <div className="table-scroll">
      <table className="lineup-starters" aria-label="Titulares da escalação">
        <thead>
          <tr>
            <th>Vaga</th>
            <th>Titular</th>
            <th>Condição</th>
            <th className="numeric">Overall</th>
            <th>Atributos do cadastro</th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => {
            const value = choices[slot.key] ?? '';
            const player = players.find((item) => String(item.id) === value);
            const condition = player && conditions[player.condition];
            const options = slotPlayers(slot, players);

            return (
              <tr key={slot.key}>
                <td>
                  <strong>{slot.label}</strong>
                  <small className="muted">{slot.hint}</small>
                </td>
                <td>
                  <Field
                    id={`lineup-${slot.key}`}
                    label={`${slot.label} ${slot.key.split('-').at(-1)}`}
                    error={errors[slot.key]}
                  >
                    <select
                      id={`lineup-${slot.key}`}
                      value={value}
                      aria-invalid={Boolean(errors[slot.key])}
                      aria-describedby={errors[slot.key] ? `lineup-${slot.key}-error` : undefined}
                      onChange={(event) => onChange(slot.key, event.target.value)}
                    >
                      <option value="">Selecionar jogador</option>
                      {options.map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                          disabled={
                            String(item.id) !== value && selectedIds.includes(String(item.id))
                          }
                        >
                          {item.name} ({item.position})
                        </option>
                      ))}
                      {value && !options.some((item) => String(item.id) === value) && (
                        <option value={value}>
                          {player?.name ?? `Jogador #${value}`} (indisponível)
                        </option>
                      )}
                    </select>
                  </Field>
                </td>
                <td>
                  {condition ? (
                    <span className={`condition-badge ${condition.className}`}>
                      <Icon name={condition.icon} />
                      {condition.label}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="numeric">{player?.overall ?? '—'}</td>
                <td className="lineup-attributes">
                  {player ? (
                    <>
                      {(player.position === 'GOL' ||
                        player.position === 'ZAG' ||
                        player.position === 'LAT') && (
                        <span>
                          Defesa <strong>{player.defending}</strong>
                        </span>
                      )}
                      {(player.position === 'ZAG' || player.position === 'LAT') && (
                        <span>
                          Drible <strong>{player.dribbling}</strong>
                        </span>
                      )}
                      {player.position === 'MEI' && (
                        <span>
                          Passe <strong>{player.passing}</strong>
                        </span>
                      )}
                      {player.position === 'ATA' && (
                        <span>
                          Finalização <strong>{player.shooting}</strong>
                        </span>
                      )}
                    </>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
