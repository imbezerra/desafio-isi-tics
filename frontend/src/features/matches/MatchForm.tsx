import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import type { Club } from '../../shared/api/contracts';
import { Field } from '../../shared/components/Field';
import { FormActions } from '../../shared/components/FormActions';
import { Message } from '../../shared/components/Message';
import { Modal } from '../../shared/components/Modal';
import { useAction } from '../../shared/hooks/useAction';
import { playMatch, type MatchDetails, type MatchInput } from './matches.api';
import { validateMatchForm, type MatchFormValues } from './match-fields';

const fields = [
  { key: 'homeId', label: 'Mandante' },
  { key: 'awayId', label: 'Visitante' },
] as const;

export function MatchForm({
  clubs,
  onClose,
  onSaved,
}: {
  clubs: Club[];
  onClose: () => void;
  onSaved: (result: MatchDetails) => void | Promise<void>;
}) {
  const [values, setValues] = useState<MatchFormValues>({ homeId: '', awayId: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof MatchFormValues, string>>>({});
  const action = useAction((input: MatchInput) => playMatch(input), onSaved);
  const navigate = useNavigate();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (action.pending) return;

    const nextErrors = validateMatchForm(values);

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      event.currentTarget
        .querySelector<HTMLElement>(`#match-${nextErrors.homeId ? 'homeId' : 'awayId'}`)
        ?.focus();

      return;
    }

    void action.submit({
      home_club_id: Number(values.homeId),
      away_club_id: Number(values.awayId),
    });
  }

  return (
    <Modal
      title="Nova partida"
      description="Escolha os clubes. A partida é jogada ao confirmar, com os titulares e suas condições atuais."
      variant="sale"
      busy={action.pending}
      onClose={onClose}
    >
      <form className="form-stack" aria-label="Nova partida" noValidate onSubmit={submit}>
        {action.error && <Message tone="error">{action.error}</Message>}
        <fieldset className="form-fields" disabled={action.pending}>
          {fields.map((field) => (
            <Field
              key={field.key}
              id={`match-${field.key}`}
              label={field.label}
              error={errors[field.key]}
            >
              <select
                id={`match-${field.key}`}
                value={values[field.key]}
                aria-invalid={Boolean(errors[field.key])}
                aria-describedby={errors[field.key] ? `match-${field.key}-error` : undefined}
                data-initial-focus={field.key === 'homeId' || undefined}
                onChange={(event) => {
                  setValues({ ...values, [field.key]: event.target.value });
                  setErrors({ ...errors, [field.key]: undefined });
                  action.reset();
                }}
              >
                <option value="">Selecionar clube</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name} ({club.acronym})
                  </option>
                ))}
                {values[field.key] &&
                  !clubs.some((club) => String(club.id) === values[field.key]) && (
                    <option value={values[field.key]}>
                      Clube #{values[field.key]} (indisponível)
                    </option>
                  )}
              </select>
            </Field>
          ))}
        </fieldset>
        {clubs.length === 0 && (
          <Message>Cadastre clubes e monte as escalações antes de jogar.</Message>
        )}
        <p className="page-note">
          Os dois clubes precisam de 5 titulares. Titular mal condicionado pode jogar, com 15% a
          menos em cada atributo durante a partida. Jogar não altera caixa, jogadores ou escalações.
        </p>
        <div className="match-lineup-links" aria-label="Consultar escalações">
          {fields.map(
            (field) =>
              values[field.key] && (
                <button
                  key={field.key}
                  type="button"
                  className="button button-outline"
                  disabled={action.pending}
                  onClick={() => {
                    onClose();
                    void navigate(`/clubs/${encodeURIComponent(values[field.key])}?tab=lineup`);
                  }}
                >
                  Escalação do {field.label.toLowerCase()}
                </button>
              ),
          )}
        </div>
        <FormActions pending={action.pending} onCancel={onClose} label="Jogar partida" />
      </form>
    </Modal>
  );
}
