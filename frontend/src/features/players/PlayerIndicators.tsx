import type { Player } from '../../shared/api/contracts';
import { Icon } from '../../shared/components/Icon';
import { indicators } from './player-fields';

export function PlayerIndicators({
  values,
}: {
  values: Partial<Record<(typeof indicators)[number]['key'], number>> | Player;
}) {
  return (
    <section className="indicator-preview" aria-label="Indicadores técnicos">
      <h3>
        <Icon name="indicator-chart" />
        Indicadores técnicos
      </h3>
      {indicators.map(({ key, label }) => (
        <div
          className={`indicator-line ${key === 'potential' ? 'indicator-potential' : ''}`}
          key={key}
        >
          <span>{label}</span>
          <strong>{values[key] ?? '—'}</strong>
          <meter min={0} max={99} value={values[key] ?? 0} aria-label={label} />
        </div>
      ))}
    </section>
  );
}
