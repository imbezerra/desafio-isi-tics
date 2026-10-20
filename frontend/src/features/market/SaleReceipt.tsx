import { Icon } from '../../shared/components/Icon';
import { Modal } from '../../shared/components/Modal';
import { formatMoney } from '../../shared/formatters';
import type { SaleResult } from './sales.api';
import { TransactionSummary } from './TransactionSummary';
import './sale-receipt.css';

export function SaleReceipt({
  result,
  clubName,
  onClose,
}: {
  result: SaleResult;
  clubName: string;
  onClose: () => void;
}) {
  return (
    <Modal
      title="Venda concluída"
      description={`${result.player_name} voltou a ficar livre.${result.contract_status === 'ENCERRADO' ? ' A fidelidade já tinha terminado, então não houve multa.' : ''}`}
      variant="receipt"
      closeIcon="sale-close"
      onClose={onClose}
    >
      <span className="sale-success-icon" aria-hidden="true">
        <Icon name="sale-success" />
      </span>
      <TransactionSummary
        label="Resultado da venda devolvido pela API"
        rows={[
          { label: 'Valor de compra', value: formatMoney(result.purchase_value) },
          {
            label: 'Valor de venda',
            hint: 'Valor de mercado no momento da venda',
            value: formatMoney(result.value),
          },
          { label: 'Dias restantes', value: result.remaining_days },
          {
            label: 'Multa',
            hint:
              result.penalty_rate === 0
                ? 'Fidelidade cumprida: sem multa'
                : `${result.penalty_rate}% do valor de venda, com teto de 10,00`,
            value: formatMoney(result.penalty),
          },
          {
            label: 'Lucro',
            value: `${result.profit > 0 ? '+' : ''}${formatMoney(result.profit)}`,
            tone: result.profit > 0 ? 'positive' : result.profit < 0 ? 'negative' : undefined,
          },
          {
            label: 'Comissão',
            hint:
              result.profit <= 0
                ? 'Sem lucro: sem comissão'
                : '10% do lucro até 10,00 + 20% do que passar',
            value: formatMoney(result.fee),
          },
          {
            label: 'Crédito no caixa',
            hint: 'Valor de venda − multa − comissão',
            value: `${result.cash_change > 0 ? '+' : ''}${formatMoney(result.cash_change)}`,
            emphasis: true,
          },
          {
            label: 'Contrato',
            value: (
              <span className="sale-contract" data-status={result.contract_status}>
                <Icon
                  name={
                    result.contract_status === 'RESCINDIDO'
                      ? 'contract-rescinded'
                      : 'contract-closed'
                  }
                />
                {result.contract_status}
              </span>
            ),
          },
          {
            label: `Novo caixa do ${clubName}`,
            value: formatMoney(result.club_cash),
            emphasis: true,
          },
        ]}
      />
      <footer className="form-actions">
        <button
          type="button"
          className="button button-outline"
          disabled
          title="O histórico será implementado na próxima etapa."
        >
          <Icon name="sale-history" />
          Histórico em breve
        </button>
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
