import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import type { Club, Player } from '../../shared/api/contracts';
import { Field } from '../../shared/components/Field';
import { FormActions } from '../../shared/components/FormActions';
import { Icon } from '../../shared/components/Icon';
import { Message } from '../../shared/components/Message';
import { Modal } from '../../shared/components/Modal';
import { formatMoney, getInitials } from '../../shared/formatters';
import { useAction } from '../../shared/hooks/useAction';
import { positions } from '../players/player-fields';
import { buyPlayer, type PurchaseResult } from './purchases.api';
import {
  toPurchaseInput,
  validatePurchaseForm,
  type PurchaseFormErrors,
  type PurchaseFormValues,
} from './purchase-fields';
import './purchase-form.css';

export function PurchaseForm({
  player,
  clubs,
  onClose,
  onSaved,
}: {
  player: Player;
  clubs: Club[];
  onClose: () => void;
  onSaved: (result: PurchaseResult) => Promise<void>;
}) {
  const [values, setValues] = useState<PurchaseFormValues>({ clubId: '', date: '', time: '' });
  const [errors, setErrors] = useState<PurchaseFormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const selectedClub = clubs.find((club) => String(club.id) === values.clubId);
  const action = useAction(
    (input: PurchaseFormValues) => buyPlayer(player.id, toPurchaseInput(input)),
    onSaved,
  );

  function update(key: keyof PurchaseFormValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validatePurchaseForm(values);

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
      title="Comprar jogador"
      description="Escolha o clube comprador e até quando vai a fidelidade do contrato."
      busy={action.pending}
      onClose={onClose}
    >
      <form ref={formRef} className="form-stack purchase-form" noValidate onSubmit={submit}>
        <div className="purchase-player">
          <span className="avatar" aria-hidden="true">
            {getInitials(player.name)}
          </span>
          <div className="purchase-player-name">
            <strong>{player.name}</strong>
            <small>
              {player.position} · {positions[player.position]} · {player.age} anos
            </small>
          </div>
          <div className="purchase-market-value">
            <small>Valor de mercado</small>
            <strong>{formatMoney(player.market_value)}</strong>
          </div>
        </div>
        <fieldset className="form-fields" disabled={action.pending}>
          <legend className="sr-only">Dados da compra</legend>
          <Field id="purchase-club" label="Clube comprador" error={errors.clubId}>
            <div className="input-icon">
              <Icon name="purchase-club" />
              <select
                id="purchase-club"
                data-initial-focus
                required
                value={values.clubId}
                onChange={(event) => update('clubId', event.target.value)}
                aria-invalid={!!errors.clubId}
                aria-describedby={errors.clubId ? 'purchase-club-error' : 'purchase-club-hint'}
              >
                <option value="">Selecione um clube</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name} ({club.acronym}) · caixa {formatMoney(club.cash)}
                  </option>
                ))}
              </select>
            </div>
            <small className="muted" id="purchase-club-hint">
              {selectedClub ? `Caixa atual: ${formatMoney(selectedClub.cash)}. ` : ''}O custo total
              (valor + taxa) pode ir até 50% do caixa.
            </small>
          </Field>
          {clubs.length === 0 && (
            <Message>
              Nenhum clube cadastrado. <Link to="/clubs">Cadastre um clube</Link> para comprar
              jogadores.
            </Message>
          )}
          <div className="purchase-date-time">
            <Field id="purchase-date" label="Data da fidelidade" error={errors.date}>
              <div className="input-icon">
                <Icon name="purchase-date" />
                <input
                  id="purchase-date"
                  required
                  inputMode="numeric"
                  placeholder="DD/MM/AAAA"
                  value={values.date}
                  onChange={(event) => update('date', event.target.value)}
                  aria-invalid={!!errors.date}
                  aria-describedby={errors.date ? 'purchase-date-error' : 'purchase-date-hint'}
                />
              </div>
            </Field>
            <Field id="purchase-time" label="Hora da fidelidade" error={errors.time}>
              <div className="input-icon">
                <Icon name="purchase-time" />
                <input
                  id="purchase-time"
                  required
                  inputMode="numeric"
                  placeholder="HH:MM"
                  value={values.time}
                  onChange={(event) => update('time', event.target.value)}
                  aria-invalid={!!errors.time}
                  aria-describedby={errors.time ? 'purchase-time-error' : 'purchase-date-hint'}
                />
              </div>
            </Field>
          </div>
          <small className="muted" id="purchase-date-hint">
            Depois do momento da compra e até 1.095 dias. Horário de Brasília; enviado com o fuso
            (-03:00). A API valida o prazo pelo horário do servidor.
          </small>
          <p className="purchase-rules">
            <Icon name="purchase-info" />A taxa é de 5% do valor de mercado, só quando ele passa de
            30,00. Taxa e novo caixa são calculados pela API ao confirmar.
          </p>
        </fieldset>
        {action.error && <Message tone="error">{action.error}</Message>}
        <FormActions
          pending={action.pending}
          onCancel={onClose}
          label="Confirmar compra"
          icon="purchase-white"
        />
      </form>
    </Modal>
  );
}
