import type { Player } from '../../shared/api/contracts';
import { Icon } from '../../shared/components/Icon';
import { formatMoney } from '../../shared/formatters';

export function PlayerResult({ player }: { player: Player }) {
  const cards = [
    { label: 'Valor de mercado', value: formatMoney(player.market_value), icon: 'detail-market' },
    { label: 'Valor base', value: formatMoney(player.base_value), icon: 'detail-base' },
    { label: 'Overall', value: player.overall, icon: 'detail-overall' },
    { label: 'Potencial', value: player.potential, icon: 'detail-potential' },
  ];

  return (
    <div className="player-result" aria-label={`Valores de ${player.name} devolvidos pela API`}>
      {cards.map((card) => (
        <div key={card.label} className="player-stat">
          <span>
            <Icon name={card.icon} />
            {card.label}
          </span>
          <strong>{card.value}</strong>
        </div>
      ))}
    </div>
  );
}
