import type { Player } from '../../shared/api/contracts';
import { formatMoney, getInitials } from '../../shared/formatters';
import { positions } from '../players/player-fields';
import './market-player.css';

export function MarketPlayer({ player }: { player: Player }) {
  return (
    <div className="market-player">
      <span className="avatar" aria-hidden="true">
        {getInitials(player.name)}
      </span>
      <div className="market-player-name">
        <strong>{player.name}</strong>
        <small>
          {player.position} · {positions[player.position]} · {player.age} anos
        </small>
      </div>
      <div className="market-player-value">
        <small>Valor de mercado</small>
        <strong>{formatMoney(player.market_value)}</strong>
      </div>
    </div>
  );
}
