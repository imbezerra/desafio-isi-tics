import type { Club, SquadPlayer } from '../../shared/api/contracts';
import { FormActions } from '../../shared/components/FormActions';
import { Icon } from '../../shared/components/Icon';
import { Message } from '../../shared/components/Message';
import { Modal } from '../../shared/components/Modal';
import { formatBrasiliaDateTime, formatMoney } from '../../shared/formatters';
import { useAction } from '../../shared/hooks/useAction';
import { MarketPlayer } from './MarketPlayer';
import { sellPlayer, type SaleResult } from './sales.api';
import { TransactionSummary } from './TransactionSummary';
import './sale-dialog.css';

export function SaleDialog({
  player,
  club,
  onClose,
  onSaved,
}: {
  player: SquadPlayer;
  club: Club;
  onClose: () => void;
  onSaved: (result: SaleResult) => Promise<void>;
}) {
  const action = useAction(() => sellPlayer(player.id), onSaved);
  const contract = player.contract;
  const loyalty = contract ? formatBrasiliaDateTime(contract.loyalty_until) : undefined;

  return (
    <Modal
      title={`Vender ${player.name}?`}
      description={`O jogador sai do elenco do ${club.name} e volta a ficar livre.`}
      variant="sale"
      closeIcon="sale-close"
      busy={action.pending}
      onClose={onClose}
    >
      <form
        className="form-stack sale-form"
        onSubmit={(event) => {
          event.preventDefault();
          void action.submit(undefined);
        }}
      >
        <div className="sale-warning" role="note">
          <Icon name="sale-warning" />
          <p>
            Se for titular, o jogador sai da escalação. O clube só volta a jogar depois de escalar
            de novo os 5 titulares.
          </p>
        </div>
        <MarketPlayer player={player} />
        {contract && loyalty ? (
          <TransactionSummary
            label="Contrato consultado na API"
            rows={[
              { label: 'Valor de compra', value: formatMoney(contract.purchase_value) },
              {
                label: 'Fim da fidelidade',
                value: (
                  <time dateTime={contract.loyalty_until}>
                    {loyalty.date}, {loyalty.time}
                  </time>
                ),
              },
              { label: 'Dias restantes', value: contract.remaining_days },
              {
                label: '% de multa se vender agora',
                value: (
                  <span className="contract-penalty" data-rate={contract.penalty_rate}>
                    {contract.penalty_rate}%
                  </span>
                ),
              },
            ]}
          />
        ) : (
          <Message>
            Contrato indisponível na consulta. A API verificará a venda ao confirmar.
          </Message>
        )}
        <p className="sale-rules">
          <Icon name="sale-info" />A venda é pelo valor de mercado do momento. Multa (teto de
          10,00), lucro, comissão e crédito são calculados pela API ao confirmar.
        </p>
        {action.error && <Message tone="error">{action.error}</Message>}
        <FormActions
          pending={action.pending}
          onCancel={onClose}
          label="Confirmar venda"
          icon="sale-white"
        />
      </form>
    </Modal>
  );
}
