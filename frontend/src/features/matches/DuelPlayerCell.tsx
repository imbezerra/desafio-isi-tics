import { Icon } from '../../shared/components/Icon';
import { getInitials } from '../../shared/formatters';
import { conditions } from '../players/player-fields';
import type { DuelPlayer } from './matches.api';

export function DuelPlayerCell({ player }: { player: DuelPlayer }) {
  const condition = conditions[player.condition];

  return (
    <div className="duel-player">
      <span className="avatar" aria-hidden="true">
        {getInitials(player.player_name)}
      </span>
      <div>
        <strong>{player.player_name}</strong>
        <small className="muted">{player.position}</small>
        <span className={`condition-badge ${condition.className}`}>
          <Icon name={condition.icon} />
          {condition.label}
        </span>
      </div>
    </div>
  );
}
