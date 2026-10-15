export function FormActions({
  pending,
  onCancel,
  label,
}: {
  pending: boolean;
  onCancel: () => void;
  label: string;
}) {
  return (
    <footer className="form-actions">
      <button type="button" className="button button-outline" disabled={pending} onClick={onCancel}>
        Cancelar
      </button>
      <button type="submit" className="button button-primary" disabled={pending}>
        {pending ? 'Enviando…' : label}
      </button>
    </footer>
  );
}
