import type { KeyboardEvent } from 'react';
import { Icon } from '../../shared/components/Icon';

export type ClubTab = 'squad' | 'lineup' | 'history';

export function ClubTabs({
  active,
  squadCount,
  onChange,
}: {
  active: ClubTab;
  squadCount: number;
  onChange: (tab: ClubTab) => void;
}) {
  function navigate(event: KeyboardEvent<HTMLButtonElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    const tabs = Array.from(
      event.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not(:disabled)',
      ),
    );
    const index = tabs.indexOf(event.currentTarget);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;

    tabs[next].click();
    tabs[next].focus();
  }

  return (
    <div className="club-tabs" role="tablist" aria-label="Seções do clube">
      <button
        id="club-squad-tab"
        type="button"
        role="tab"
        aria-selected={active === 'squad'}
        aria-controls="club-squad"
        tabIndex={active === 'squad' ? 0 : -1}
        onClick={() => onChange('squad')}
        onKeyDown={navigate}
      >
        <Icon name="club-tab-squad" />
        Elenco <span>{squadCount}</span>
      </button>
      <button
        id="club-lineup-tab"
        type="button"
        role="tab"
        aria-selected={active === 'lineup'}
        aria-controls="club-lineup"
        tabIndex={active === 'lineup' ? 0 : -1}
        onClick={() => onChange('lineup')}
        onKeyDown={navigate}
      >
        <Icon name="club-tab-lineup" />
        Escalação
      </button>
      <button
        id="club-history-tab"
        type="button"
        role="tab"
        aria-selected={active === 'history'}
        aria-controls="club-history"
        tabIndex={active === 'history' ? 0 : -1}
        onClick={() => onChange('history')}
        onKeyDown={navigate}
      >
        <Icon name="club-tab-history" />
        Histórico
      </button>
    </div>
  );
}
