import { useState, type FormEvent } from 'react';
import type { Player } from '../../shared/api/contracts';
import { Icon } from '../../shared/components/Icon';
import { Message } from '../../shared/components/Message';
import { useAction } from '../../shared/hooks/useAction';
import { FormationPicker } from './FormationPicker';
import { LineupStarters } from './LineupStarters';
import { LineupPreview } from './LineupPreview';
import { getLineupSlots, initialLineupChoices, validateLineupForm } from './lineup-fields';
import { saveLineup, type Formation, type Lineup, type LineupInput } from './lineups.api';
import './lineup-card.css';

export function LineupForm({
  clubId,
  lineup,
  players,
  onSaved,
  onEdit,
}: {
  clubId: string;
  lineup: Lineup;
  players: Player[];
  onSaved: (result: Lineup) => void;
  onEdit: () => void;
}) {
  const [formation, setFormation] = useState<Formation | ''>(lineup.formation ?? '');
  const [choices, setChoices] = useState(() => initialLineupChoices(lineup));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const action = useAction(
    (input: LineupInput) => saveLineup(clubId, input),
    (result) => {
      // Mesmo um resultado igual ao cache restaura a ordem canônica dos titulares.
      setFormation(result.formation ?? '');
      setChoices(initialLineupChoices(result));
      setErrors({});
      onSaved(result);
    },
  );

  const slots = getLineupSlots(formation);
  const unfit = slots.flatMap((slot) =>
    players.filter(
      (player) =>
        String(player.id) === choices[slot.key] && player.condition === 'MAL_CONDICIONADO',
    ),
  );

  function editing() {
    setErrors({});
    action.reset();
    onEdit();
  }

  function changeFormation(value: Formation) {
    editing();
    setFormation(value);
    setChoices(
      Object.fromEntries(getLineupSlots(value).map((slot) => [slot.key, choices[slot.key] ?? ''])),
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (action.pending) return;

    const nextErrors = validateLineupForm(formation, choices);

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      event.currentTarget
        .querySelector<HTMLElement>(
          nextErrors.formation ? '[name="formation"]' : `#lineup-${Object.keys(nextErrors)[0]}`,
        )
        ?.focus();

      return;
    }

    onEdit();
    void action.submit({
      formation: formation as Formation,
      player_ids: slots.map((slot) => Number(choices[slot.key])),
    });
  }

  return (
    <div className="lineup-layout">
      <form
        className="lineup-card lineup-form"
        aria-label="Escalação do clube"
        aria-busy={action.pending}
        noValidate
        onSubmit={submit}
      >
        <header className="lineup-card-heading lineup-starters-heading">
          <div>
            <h2>Titulares</h2>
            <p>
              1 goleiro e 4 jogadores de linha, na formação escolhida. Salvar troca os 5 de uma vez.
            </p>
          </div>
          <span
            className={`lineup-status ${lineup.complete ? 'fit' : 'unfit'}`}
            title="Situação da última escalação salva"
          >
            <Icon name={lineup.complete ? 'lineup-complete' : 'lineup-incomplete'} />
            {lineup.complete ? 'Completa' : 'Incompleta'}
          </span>
        </header>
        {action.error && (
          <div className="lineup-message">
            <Message tone="error">{action.error}</Message>
          </div>
        )}
        {!lineup.complete && (
          <div className="lineup-message">
            <div className="lineup-warning" role="status">
              <Icon name="sale-warning" />
              <div>
                <strong>Escalação incompleta: o clube não pode jogar.</strong>
                <p>
                  Escolha a formação e os 5 titulares e salve para habilitar partidas. Titular
                  vendido ou que fica doente sai da escalação; precisa ser escalado de novo.
                </p>
              </div>
            </div>
          </div>
        )}
        <fieldset className="lineup-controls" disabled={action.pending}>
          <legend className="sr-only">Escolhas da escalação</legend>
          <FormationPicker value={formation} error={errors.formation} onChange={changeFormation} />
          <LineupStarters
            slots={slots}
            choices={choices}
            players={players}
            errors={errors}
            onChange={(slot, id) => {
              editing();
              setChoices({ ...choices, [slot]: id });
            }}
          />
          {unfit.length > 0 && (
            <div className="lineup-message">
              <div className="lineup-warning" role="status">
                <Icon name="sale-warning" />
                <div>
                  <strong>
                    Mal condicionados: {unfit.map((player) => player.name).join(', ')}
                  </strong>
                  <p>
                    Podem jogar, mas cada atributo vale 15% a menos durante a partida. Os valores
                    acima são os do cadastro.
                  </p>
                </div>
              </div>
            </div>
          )}
          <footer className="lineup-footer">
            <p>
              A escalação vale até ser trocada. Titular vendido ou que fica doente sai dela, e o
              clube só volta a jogar depois de escalar de novo.
            </p>
            <button
              type="button"
              className="button button-outline"
              onClick={() => {
                editing();
                setFormation(lineup.formation ?? '');
                setChoices(initialLineupChoices(lineup));
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="button button-primary">
              <Icon name="lineup-save" />
              {action.pending ? 'Salvando…' : 'Salvar escalação'}
            </button>
          </footer>
        </fieldset>
      </form>
      <LineupPreview formation={formation} slots={slots} choices={choices} players={players} />
    </div>
  );
}
