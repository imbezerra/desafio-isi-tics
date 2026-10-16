export function FormActions({
  pending,
  onCancel,
  label,
  destructive = false,
  icon,
}: {
  pending: boolean;
  onCancel: () => void;
  label: string;
  destructive?: boolean;
  icon?: string;
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
        {(destructive || icon) && <Icon name={destructive ? 'delete-white' : icon!} />}
        {pending ? 'Enviando…' : label}
      </button>
    </footer>
  );
}

import { Icon } from './Icon';
