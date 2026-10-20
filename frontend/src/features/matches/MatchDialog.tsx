import { useClubs } from '../clubs/clubs.queries';
import { Message } from '../../shared/components/Message';
import { Modal } from '../../shared/components/Modal';
import { MatchForm } from './MatchForm';
import type { MatchDetails } from './matches.api';

export function MatchDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (result: MatchDetails) => void | Promise<void>;
}) {
  const query = useClubs();

  if (!query.data || query.isError)
    return (
      <Modal
        title="Nova partida"
        description="Escolha o mandante e o visitante."
        variant="sale"
        onClose={onClose}
      >
        {query.isError ? (
          <Message tone="error" onRetry={() => void query.refetch()}>
            {query.error.message}
          </Message>
        ) : (
          <Message>Carregando clubes…</Message>
        )}
      </Modal>
    );

  return <MatchForm clubs={query.data} onClose={onClose} onSaved={onSaved} />;
}
