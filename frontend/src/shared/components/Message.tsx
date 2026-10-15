import type { ReactNode } from 'react';

export function Message({
  children,
  tone = 'info',
  onRetry,
}: {
  children: ReactNode;
  tone?: 'info' | 'error' | 'success';
  onRetry?: () => void;
}) {
  return (
    <div className={`message message-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <span>{children}</span>
      {onRetry && (
        <button className="button button-outline" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}
