import type { Club } from '../../shared/api/contracts';
import { formatMoney } from '../../shared/formatters';

export function ClubValues({ club }: { club: Club }) {
  return (
    <dl className="club-values" aria-label={`Valores de ${club.name} devolvidos pela API`}>
      <div>
        <dt>Caixa</dt>
        <dd>{formatMoney(club.cash)}</dd>
      </div>
      <div>
        <dt>Valor do elenco</dt>
        <dd>{formatMoney(club.squad_value)}</dd>
      </div>
      <div>
        <dt>Patrimônio</dt>
        <dd>{formatMoney(club.net_worth)}</dd>
      </div>
    </dl>
  );
}
