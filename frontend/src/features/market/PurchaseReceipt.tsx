import { Link } from 'react-router';
import { Icon } from '../../shared/components/Icon';
import { Modal } from '../../shared/components/Modal';
import { formatBrasiliaDateTime, formatMoney } from '../../shared/formatters';
import type { PurchaseResult } from './purchases.api';
import './purchase-receipt.css';

export function PurchaseReceipt({
  result,
  clubName,
  onClose,
}: {
  result: PurchaseResult;
  clubName: string;
  onClose: () => void;
}) {
  const loyalty = formatBrasiliaDateTime(result.contract.loyalty_until);

  return (
    <Modal
      title="Compra concluída"
      description={`${result.player_name} agora é do ${clubName}.`}
      variant="receipt"
      onClose={onClose}
    >
      <span className="purchase-success-icon" aria-hidden="true">
        <Icon name="purchase-success" />
      </span>
      <dl className="purchase-receipt" aria-label="Resultado da compra devolvido pela API">
        <div>
          <dt>
            Valor<small>Valor de mercado no momento da compra</small>
          </dt>
          <dd>{formatMoney(result.value)}</dd>
        </div>
        <div>
          <dt>
            Taxa<small>Valor devolvido pela API</small>
          </dt>
          <dd>{formatMoney(result.fee)}</dd>
        </div>
        <div className="purchase-receipt-total">
          <dt>
            Custo total<small>Valor + taxa</small>
          </dt>
          <dd>{formatMoney(result.value + result.fee)}</dd>
        </div>
        <div>
          <dt>Fim da fidelidade</dt>
          <dd>
            <time dateTime={result.contract.loyalty_until}>
              {loyalty.date}, {loyalty.time}
            </time>
          </dd>
        </div>
        <div>
          <dt>Contrato</dt>
          <dd className="condition-badge fit">
            <Icon name="condition-fit" />
            {result.contract.status}
          </dd>
        </div>
        <div className="purchase-receipt-total">
          <dt>Novo caixa do {clubName}</dt>
          <dd>{formatMoney(result.club_cash)}</dd>
        </div>
      </dl>
      <footer className="form-actions">
        <Link className="button button-outline" to={`/clubs/${result.club_id}`}>
          Ver clube
          <Icon name="purchase-club-next" />
        </Link>
        <button
          type="button"
          className="button button-primary"
          data-initial-focus
          onClick={onClose}
        >
          Fechar
        </button>
      </footer>
    </Modal>
  );
}
