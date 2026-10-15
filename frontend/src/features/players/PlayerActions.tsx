import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Player } from '../../shared/api/contracts';
import { Icon } from '../../shared/components/Icon';

export type PlayerAction = 'details' | 'edit' | 'condition';

export function PlayerActions({
  player,
  onSelect,
}: {
  player: Player;
  onSelect: (action: PlayerAction) => void;
}) {
  const [position, setPosition] = useState<{ top: number; left: number }>();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!position) return;

    menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus();

    function dismiss(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target) &&
        !triggerRef.current?.contains(event.target)
      )
        setPosition(undefined);
    }

    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setPosition(undefined);
        triggerRef.current?.focus();
      }
    }

    function closeOnScroll() {
      setPosition(undefined);
    }

    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    window.addEventListener('scroll', closeOnScroll, true);
    window.addEventListener('resize', closeOnScroll);

    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('scroll', closeOnScroll, true);
      window.removeEventListener('resize', closeOnScroll);
    };
  }, [position]);

  function select(action: PlayerAction) {
    triggerRef.current?.focus();
    setPosition(undefined);
    onSelect(action);
  }

  const actions: { kind: PlayerAction; label: string; icon: string }[] = [
    { kind: 'details', label: 'Ver detalhes', icon: 'action-details' },
    { kind: 'edit', label: 'Editar', icon: 'action-edit' },
    { kind: 'condition', label: 'Alterar condição', icon: 'action-condition' },
  ];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="button button-icon"
        aria-label={`Ações de ${player.name}`}
        aria-haspopup="menu"
        aria-expanded={!!position}
        aria-controls={position ? menuId : undefined}
        onClick={() => {
          const rect = triggerRef.current!.getBoundingClientRect();

          setPosition(
            position
              ? undefined
              : {
                  top: Math.min(rect.bottom + 4, window.innerHeight - 210),
                  left: Math.max(8, rect.right - 224),
                },
          );
        }}
      >
        <Icon name="player-actions" />
      </button>
      {position &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            className="player-actions-menu"
            role="menu"
            aria-label={`Ações de ${player.name}`}
            style={position}
            onBlur={(event) => {
              if (
                event.relatedTarget instanceof Node &&
                !event.currentTarget.contains(event.relatedTarget)
              )
                setPosition(undefined);
            }}
            onKeyDown={(event) => {
              if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              const buttons = [...event.currentTarget.querySelectorAll('button')];
              const index = buttons.findIndex((button) => button === document.activeElement);
              const next =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? buttons.length - 1
                    : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) %
                      buttons.length;

              buttons[next]?.focus();
            }}
          >
            <small>{player.name}</small>
            {actions.map((action) => (
              <button
                type="button"
                role="menuitem"
                key={action.kind}
                onClick={() => select(action.kind)}
              >
                <Icon name={action.icon} />
                {action.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
