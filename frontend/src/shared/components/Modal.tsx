import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';
import './modal.css';

export function Modal({
  title,
  description,
  variant = 'default',
  busy = false,
  onClose,
  children,
}: {
  title: string;
  description: string;
  variant?: 'default' | 'wide' | 'small' | 'drawer';
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;

    dialog?.showModal();
    dialog?.querySelector<HTMLElement>('[data-initial-focus]')?.focus();

    return () => {
      dialog?.close();

      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={`modal modal-${variant}`}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault();

        if (!busy) onClose();
      }}
    >
      <header className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
        <button
          type="button"
          className="button button-icon modal-close"
          aria-label="Fechar janela"
          disabled={busy}
          onClick={onClose}
        >
          <Icon name="dialog-close" />
        </button>
      </header>
      {children}
    </dialog>
  );
}
