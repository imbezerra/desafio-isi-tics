import { Icon } from '../../shared/components/Icon';
import type { Formation } from './lineups.api';
import { formations } from './lineup-fields';
import './formation-picker.css';

export function FormationPicker({
  value,
  error,
  onChange,
}: {
  value: Formation | '';
  error?: string;
  onChange: (formation: Formation) => void;
}) {
  return (
    <fieldset
      className="formation-picker"
      aria-describedby={error ? 'formation-error' : 'formation-hint'}
    >
      <legend>Formação</legend>
      <p id="formation-hint">
        Os números contam os jogadores de linha de trás para frente. O goleiro fica fora da conta.
      </p>
      <div className="formation-options">
        {formations.map((formation) => (
          <label
            key={formation.value}
            className="formation-option"
            data-selected={value === formation.value}
          >
            <span className="formation-image">
              <Icon name={`lineup-${formation.value}`} />
            </span>
            <span>
              <span className="formation-title">
                <span className="formation-radio">
                  <input
                    type="radio"
                    name="formation"
                    value={formation.value}
                    checked={value === formation.value}
                    onChange={() => onChange(formation.value)}
                    aria-invalid={Boolean(error)}
                  />
                  {value === formation.value && <Icon name="lineup-radio" />}
                </span>
                <strong>{formation.value}</strong>
              </span>
              <small>{formation.label}</small>
            </span>
          </label>
        ))}
      </div>
      {error && (
        <small id="formation-error" className="field-error">
          {error}
        </small>
      )}
    </fieldset>
  );
}
