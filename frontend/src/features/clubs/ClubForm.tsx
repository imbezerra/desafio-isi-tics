import { useRef, useState, type FormEvent } from 'react';
import type { Club } from '../../shared/api/contracts';
import { Field } from '../../shared/components/Field';
import { FormActions } from '../../shared/components/FormActions';
import { Icon } from '../../shared/components/Icon';
import { Message } from '../../shared/components/Message';
import { Modal } from '../../shared/components/Modal';
import { useAction } from '../../shared/hooks/useAction';
import { toCreateClubInput, validateClubForm, type ClubFormErrors } from './club-fields';
import { createClub, type CreateClubInput } from './clubs.api';

export function ClubForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (club: Club) => Promise<void>;
}) {
  const [values, setValues] = useState<CreateClubInput>({ name: '', acronym: '' });
  const [errors, setErrors] = useState<ClubFormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const action = useAction(
    (input: CreateClubInput) => createClub(toCreateClubInput(input)),
    onSaved,
  );

  function update(key: keyof CreateClubInput, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateClubForm(values);

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );

      return;
    }

    void action.submit(values);
  }

  return (
    <Modal
      title="Novo clube"
      description="Informe o nome e a sigla do clube."
      variant="compact"
      busy={action.pending}
      onClose={onClose}
    >
      <form ref={formRef} className="form-stack" noValidate onSubmit={submit}>
        <fieldset className="form-fields" disabled={action.pending}>
          <legend className="sr-only">Dados do clube</legend>
          <Field id="club-name" label="Nome" error={errors.name}>
            <div className="input-icon">
              <Icon name="field-club" />
              <input
                id="club-name"
                data-initial-focus
                required
                value={values.name}
                placeholder="Ex.: Leões da Serra"
                onChange={(event) => update('name', event.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'club-name-error' : 'club-name-hint'}
              />
            </div>
            <small className="muted" id="club-name-hint">
              De 3 a 60 caracteres e de 2 a 5 palavras; só letras, espaços, hífen e ponto. Não pode
              repetir outro clube.
            </small>
          </Field>
          <Field id="club-acronym" label="Sigla" error={errors.acronym}>
            <input
              id="club-acronym"
              required
              value={values.acronym}
              placeholder="Ex.: LDS"
              spellCheck={false}
              onChange={(event) => update('acronym', event.target.value)}
              aria-invalid={!!errors.acronym}
              aria-describedby={errors.acronym ? 'club-acronym-error' : 'club-acronym-hint'}
            />
            <small className="muted" id="club-acronym-hint">
              3 letras de A a Z, maiúsculas, que aparecem no nome nessa ordem; a primeira é a
              primeira letra do nome. Não podem ser todas iguais.
            </small>
          </Field>
          <p className="club-starting-cash">
            <Icon name="club-wallet" />O clube começa com 300,00 em caixa e sem jogadores.
          </p>
        </fieldset>
        {action.error && <Message tone="error">{action.error}</Message>}
        <FormActions pending={action.pending} onCancel={onClose} label="Criar clube" />
      </form>
    </Modal>
  );
}
