import type { Player } from '../../shared/api/contracts';
import { Icon } from '../../shared/components/Icon';
import { getInitials } from '../../shared/formatters';
import { conditions, positions } from './player-fields';

export function PlayerIdentity({ player }: { player: Player }) {
  const condition = conditions[player.condition];

  return (
    <div className="player-identity">
      <span className="avatar" aria-hidden="true">
        {getInitials(player.name)}
      </span>
      <div className="identity-text">
        <strong>{player.name}</strong>
        <small>
          {positions[player.position]} · {player.age} anos
        </small>
      </div>
      <span className={`condition-badge ${condition.className}`}>
        <Icon name={condition.icon} />
        {condition.label}
      </span>
      {player.club_id === null && <span className="free-badge">Livre</span>}
    </div>
  );
}
