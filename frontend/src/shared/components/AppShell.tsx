import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useOverview } from '../../features/overview/overview.queries';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { Message } from './Message';

export function AppShell({
  children,
  onRefresh,
  refreshing,
}: {
  children: ReactNode;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const overview = useOverview();
  const data = overview.data;

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {!collapsed && (
        <aside className="sidebar" aria-label="Menu principal">
          <Logo />
          <nav>
            <p className="nav-label">Mercado</p>
            <Link className="nav-item active" to="/players" aria-current="page">
              <Icon name="nav-players" />
              Jogadores<span>{data?.playerCount ?? '–'}</span>
            </Link>
            <div className="nav-item pending">
              <Icon name="nav-clubs" />
              Clubes<small>Em breve</small>
            </div>
            <p className="nav-label">Liga</p>
            <div className="nav-item pending">
              <Icon name="nav-matches" />
              Partidas<small>Em breve</small>
            </div>
            <div className="nav-item pending">
              <Icon name="nav-standings" />
              Classificação<small>Em breve</small>
            </div>
          </nav>
          <section className="sidebar-clubs" aria-label="Clubes cadastrados">
            <p className="nav-label">Clubes</p>
            {overview.isPending ? (
              <small>Carregando clubes…</small>
            ) : overview.isError ? (
              <Message tone="error" onRetry={() => void overview.refetch()}>
                {overview.error.message}
              </Message>
            ) : data?.clubs.length ? (
              data.clubs.map((club) => (
                <div className="sidebar-club" key={club.id}>
                  <span>{Array.from(club.name)[0]}</span>
                  {club.name}
                </div>
              ))
            ) : (
              <small>Nenhum clube cadastrado.</small>
            )}
          </section>
          <footer className="sidebar-footer">
            <div>
              <Icon name="sidebar-trophy" />
              <span>
                Liga Fictícia 2026
                <small>
                  {data
                    ? `${data.clubs.length} clubes · ${data.playerCount} jogadores`
                    : 'Dados indisponíveis'}
                </small>
              </span>
            </div>
            <div>
              <Icon name="sidebar-match" />
              <span>
                Última partida
                <small>
                  {data?.latestMatch
                    ? `${data.latestMatch.home.club_name} ${data.latestMatch.home.goals} × ${data.latestMatch.away.goals} ${data.latestMatch.away.club_name}`
                    : 'Nenhuma partida registrada'}
                </small>
              </span>
            </div>
            <p>
              <Icon name="sidebar-clock" />
              Horário de Brasília (UTC−3)
            </p>
          </footer>
        </aside>
      )}
      <div className="app-inset">
        <div className="app-panel">
          <header className="topbar">
            <button
              className="button button-icon"
              aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
              aria-expanded={!collapsed}
              onClick={() => setCollapsed(!collapsed)}
            >
              <Icon name="panel-toggle" />
            </button>
            <span className="topbar-separator" />
            <span className="muted">Mercado</span>
            <Icon name="breadcrumb-next" />
            <span>Jogadores</span>
            <button
              className="button button-icon refresh-button"
              aria-label="Atualizar dados"
              disabled={refreshing}
              onClick={onRefresh}
            >
              <Icon name="refresh" />
            </button>
          </header>
          <main id="main-content" className="page-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
