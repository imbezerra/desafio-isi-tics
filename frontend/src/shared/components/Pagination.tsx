import { Icon } from './Icon';

export function Pagination({
  page,
  totalPages,
  totalItems,
  limit,
  onChange,
  disabled,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onChange: (page: number) => void;
  disabled: boolean;
}) {
  const first = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, totalItems);

  return (
    <footer className="pagination">
      <span aria-live="polite">
        Mostrando {first}–{last} de {totalItems} jogadores
      </span>
      <nav aria-label="Paginação de jogadores">
        <button
          className="button button-ghost"
          disabled={disabled || page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <Icon name="previous" />
          Anterior
        </button>
        <span aria-current="page" className="page-number">
          {page} / {Math.max(1, totalPages)}
        </span>
        <button
          className="button button-ghost"
          disabled={disabled || page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Próxima
          <Icon name="next" />
        </button>
      </nav>
    </footer>
  );
}
