import { useRef, useState, type FormEvent } from 'react';
import type { Player } from '../../shared/api/contracts';
import { Field } from '../../shared/components/Field';
import { FormActions } from '../../shared/components/FormActions';
import { Icon } from '../../shared/components/Icon';
import { Message } from '../../shared/components/Message';
import { Modal } from '../../shared/components/Modal';
import { useAction } from '../../shared/hooks/useAction';
import { createPlayer } from './players.api';
import {
  initialPlayerValues,
  numericFields,
  positions,
  toCreatePlayerInput,
  validatePlayerForm,
  type PlayerFormErrors,
  type PlayerFormValues,
} from './player-fields';
import { PlayerIndicators } from './PlayerIndicators';

export function PlayerForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (player: Player) => Promise<void>;
}) {
  const [values, setValues] = useState(() => initialPlayerValues());
  const [errors, setErrors] = useState<PlayerFormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const action = useAction(
    (input: PlayerFormValues) => createPlayer(toCreatePlayerInput(input)),
    onSaved,
  );

  function update(key: keyof PlayerFormValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validatePlayerForm(values, false);

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );

      return;
    }

    void action.submit(values);
  }

  const preview = Object.fromEntries(
    numericFields.map(({ key }) => [key, values[key] === '' ? undefined : Number(values[key])]),
  );

  function numberField(field: (typeof numericFields)[number]) {
    const id = `player-${field.key}`;

    return (
      <Field key={field.key} id={id} label={field.label} error={errors[field.key]}>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={field.min}
          max={field.max}
          step={1}
          required
          value={values[field.key]}
          onChange={(event) => update(field.key, event.target.value)}
          aria-invalid={!!errors[field.key]}
          aria-describedby={errors[field.key] ? `${id}-error` : `${id}-hint`}
        />
        <small className="muted" id={`${id}-hint`}>
          {field.min}–{field.max}
        </small>
      </Field>
    );
  }

  return (
    <Modal
      title="Novo jogador"
      description="Informe os dados e indicadores. O valor base e o overall serão calculados pela API."
      variant="wide"
      busy={action.pending}
      onClose={onClose}
    >
      <form ref={formRef} noValidate onSubmit={submit} className="form-stack">
        <fieldset className="form-fields" disabled={action.pending}>
          <legend className="sr-only">Dados do jogador</legend>
          <Field id="player-name" label="Nome" error={errors.name}>
            <div className="input-icon">
              <Icon name="field-player" />
              <input
                id="player-name"
                data-initial-focus
                required
                value={values.name}
                placeholder="Ex.: Eduardo Paiva"
                onChange={(event) => update('name', event.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'player-name-error' : 'player-name-hint'}
              />
            </div>
            <small className="muted" id="player-name-hint">
              3–100 caracteres, pelo menos duas palavras e sem dígitos.
            </small>
          </Field>
          <fieldset
            className="position-options"
            aria-describedby={errors.position ? 'player-position-error' : undefined}
          >
            <legend>Posição</legend>
            <div>
              {Object.entries(positions).map(([code, label]) => (
                <label
                  key={code}
                  className={`position-option ${values.position === code ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="position"
                    value={code}
                    checked={values.position === code}
                    onChange={() => update('position', code)}
                    required
                    aria-invalid={!!errors.position}
                    disabled={action.pending}
                  />
                  <strong>{code}</strong>
                  <small>{label}</small>
                </label>
              ))}
            </div>
            {errors.position && (
              <small className="field-error" id="player-position-error">
                {errors.position}
              </small>
            )}
          </fieldset>
          <div className="player-basic-fields">
            {numericFields.slice(0, 2).map(numberField)}
            <Field id="player-base" label="Valor base">
              <div className="input-icon">
                <Icon name="field-lock" />
                <input id="player-base" disabled value="Após salvar" />
              </div>
            </Field>
          </div>
          <section className="player-technical-fields">
            <h3>Indicadores técnicos</h3>
            <p className="muted">
              Informe os sete indicadores. A API valida também a soma e a relação com o potencial e
              a idade.
            </p>
            <div className="technical-layout">
              <div className="indicator-fields">
                {numericFields.slice(2).map(numberField)}
                <Field id="player-overall" label="Overall">
                  <div className="input-icon">
                    <Icon name="field-lock" />
                    <input id="player-overall" disabled value="Após salvar" />
                  </div>
                </Field>
              </div>
              <PlayerIndicators values={preview} />
            </div>
            <p className="page-note">
              <Icon name="dialog-info" />O jogador começa livre e Apto.
            </p>
          </section>
        </fieldset>
        {action.error && <Message tone="error">{action.error}</Message>}
        <FormActions pending={action.pending} onCancel={onClose} label="Salvar jogador" />
      </form>
    </Modal>
  );
}
