export function FormActions({
  pending,
  onCancel,
  label,
  destructive = false,
}: {
  pending: boolean;
  onCancel: () => void;
  label: string;
  destructive?: boolean;
}) {
  return (
    <footer className="form-actions">
      <button type="button" className="button button-outline" disabled={pending} onClick={onCancel}>
        Cancelar
      </button>
      <button
        type="submit"
        className={`button ${destructive ? 'button-destructive' : 'button-primary'}`}
        disabled={pending}
      >
        {destructive && <Icon name="delete-white" />}
        {pending ? 'Enviando…' : label}
      </button>
    </footer>
  );
}

import { Icon } from './Icon';
