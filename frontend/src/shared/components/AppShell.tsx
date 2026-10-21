import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router';
import { useOverview } from '../../features/overview/overview.queries';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { Message } from './Message';

export function AppShell({
  children,
  onRefresh,
  refreshing,
  pageTitle = 'Jogadores',
  parentPage,
  onCreateClub,
}: {
  children: ReactNode;
  onRefresh: () => void;
  refreshing: boolean;
  pageTitle?: string;
  parentPage?: { label: string; to: string };
  onCreateClub?: () => void;
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
            <NavLink
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              to="/players"
            >
              {({ isActive }) => (
                <>
                  <Icon name={isActive ? 'nav-players' : 'nav-players-idle'} />
                  Jogadores <span>{data?.playerCount ?? '–'}</span>
                </>
              )}
            </NavLink>
            <NavLink
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              to="/clubs"
            >
              {({ isActive }) => (
                <>
                  <Icon name={isActive ? 'nav-clubs-active' : 'nav-clubs'} />
                  Clubes <span>{data?.clubs.length ?? '–'}</span>
                </>
              )}
            </NavLink>
            <p className="nav-label">Liga</p>
            <NavLink
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              to="/matches"
            >
              <Icon name="nav-matches" />
              Partidas<span>{data?.matchCount ?? '–'}</span>
            </NavLink>
            <NavLink
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              to="/standings"
            >
              {({ isActive }) => (
                <>
                  <Icon name={isActive ? 'nav-standings-active' : 'nav-standings'} />
                  Classificação
                </>
              )}
            </NavLink>
          </nav>
          <section className="sidebar-clubs" aria-label="Clubes cadastrados">
            <div className="sidebar-clubs-heading">
              <p className="nav-label">Clubes</p>
              {onCreateClub && (
                <button
                  className="button button-icon"
                  aria-label="Novo clube pelo menu"
                  onClick={onCreateClub}
                >
                  <Icon name="club-sidebar-create" />
                </button>
              )}
            </div>
            {overview.isPending ? (
              <small>Carregando clubes…</small>
            ) : overview.isError ? (
              <Message tone="error" onRetry={() => void overview.refetch()}>
                {overview.error.message}
              </Message>
            ) : data?.clubs.length ? (
              data.clubs.map((club) => (
                <NavLink
                  className={({ isActive }) => `sidebar-club ${isActive ? 'active' : ''}`}
                  key={club.id}
                  to={`/clubs/${club.id}`}
                  aria-label={`Abrir ${club.name}`}
                >
                  <span className="sidebar-club-badge" aria-hidden="true">
                    {Array.from(club.acronym)[0]}
                  </span>
                  <span className="sidebar-club-name">{club.name}</span>
                </NavLink>
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
            <nav className="breadcrumbs" aria-label="Caminho da página">
              <ol>
                <li>
                  <Link className="muted breadcrumb-link" to="/">
                    Início
                  </Link>
                </li>
                {parentPage && (
                  <li>
                    <Icon name="breadcrumb-next" />
                    <Link className="muted breadcrumb-link" to={parentPage.to}>
                      {parentPage.label}
                    </Link>
                  </li>
                )}
                <li aria-current="page">
                  <Icon name="breadcrumb-next" />
                  <span title={pageTitle}>{pageTitle}</span>
                </li>
              </ol>
            </nav>
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
