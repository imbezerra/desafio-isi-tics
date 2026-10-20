import type { Player } from '../../shared/api/contracts';
import { Icon } from '../../shared/components/Icon';
import { getInitials } from '../../shared/formatters';
import { PlayerIdentity } from '../players/PlayerIdentity';
import type { Formation } from './lineups.api';
import type { LineupSlot } from './lineup-fields';
import './lineup-card.css';
import './lineup-preview.css';

export function LineupPreview({
  formation,
  slots,
  choices,
  players,
}: {
  formation: Formation | '';
  slots: LineupSlot[];
  choices: Record<string, string>;
  players: Player[];
}) {
  const selectedIds = slots.map((slot) => choices[slot.key]);
  const reserves = players.filter((player) => !selectedIds.includes(String(player.id)));

  return (
    <aside className="lineup-sidebar" aria-label="Prévia e reservas">
      <section className="lineup-card">
        <header className="lineup-card-heading">
          <h2>Em campo</h2>
          <p>
            Prévia {formation ? `da formação ${formation}` : 'das escolhas'}, do goleiro ao ataque.
          </p>
        </header>
        <div className="lineup-pitch-wrap">
          <div className="lineup-pitch" aria-hidden="true">
            <Icon name="lineup-pitch" className="lineup-pitch-lines" />
            {slots.map((slot) => {
              const sameSector = slots.filter((item) => item.sector === slot.sector);
              const index = sameSector.findIndex((item) => item.key === slot.key);
              const player = players.find((item) => String(item.id) === choices[slot.key]);
              const top = { goalkeeper: 285, defending: 217, midfield: 141, attack: 54 }[
                slot.sector
              ];

              return (
                <div
                  key={slot.key}
                  className="lineup-marker"
                  style={{ left: `${((index + 1) / (sameSector.length + 1)) * 100}%`, top }}
                >
                  <span className={`lineup-avatar ${player ? '' : 'lineup-vacant'}`}>
                    {player ? getInitials(player.name) : <Icon name="lineup-empty" />}
                    {player?.condition === 'MAL_CONDICIONADO' && (
                      <span className="lineup-unfit-marker">
                        <Icon name="lineup-unfit" />
                      </span>
                    )}
                  </span>
                  <small>{player ? player.name.trim().split(/\s+/).at(-1) : slot.label}</small>
                </div>
              );
            })}
          </div>
        </div>
        <p className="lineup-preview-note">
          <Icon name="lineup-duels" />
          Na partida, atacam os 3 jogadores de linha mais avançados e defendem o goleiro e os 2 mais
          recuados. É gol quando o ataque é maior que a defesa.
        </p>
      </section>
      <section className="lineup-card">
        <header className="lineup-card-heading">
          <h2>Reservas</h2>
          <p>Jogadores do elenco fora das escolhas atuais.</p>
        </header>
        <div className="lineup-reserves">
          {players.length === 0 ? (
            <p className="muted">Este clube ainda não tem jogadores.</p>
          ) : reserves.length === 0 ? (
            <p className="muted">Nenhum reserva: todos os jogadores do elenco estão escolhidos.</p>
          ) : (
            reserves.map((player) => (
              <div key={player.id} data-sick={player.condition === 'DOENTE'}>
                <PlayerIdentity player={player} />
              </div>
            ))
          )}
          {reserves.some((player) => player.condition === 'DOENTE') && (
            <p className="lineup-reserve-note">
              <Icon name="lineup-lock" />
              Doente não pode ser escalado.
            </p>
          )}
        </div>
      </section>
    </aside>
  );
}
