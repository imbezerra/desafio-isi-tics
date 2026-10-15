import { Fragment, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useOverview } from '../overview/overview.queries';
import { Icon } from '../../shared/components/Icon';
import { Logo } from '../../shared/components/Logo';
import { Message } from '../../shared/components/Message';
import './home.css';

const steps = [
  {
    title: 'Jogadores',
    icon: 'step-players',
    text: 'Nascem livres e Apto; o valor de mercado vem da condição, agilidade e idade.',
  },
  { title: 'Clubes', icon: 'step-clubs', text: 'Começam com 300,00 em caixa e sem jogadores.' },
  {
    title: 'Compra',
    icon: 'step-purchase',
    text: 'Valor + taxa, até 50% do caixa, com contrato de fidelidade.',
  },
  {
    title: 'Venda',
    icon: 'step-sale',
    text: 'Multa antes do fim da fidelidade e comissão sobre o lucro.',
  },
  {
    title: 'Histórico',
    icon: 'step-history',
    text: 'Toda compra e venda fica registrada, com totais e CSV.',
  },
  {
    title: 'Liga',
    icon: 'step-league',
    text: 'Escale 5 titulares e jogue partidas que entram na classificação.',
  },
];

export function HomePage() {
  const overview = useOverview();
  const navigate = useNavigate();

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Enter' && event.target === document.body && !event.repeat) {
        event.preventDefault();
        void navigate('/players');
      }
    }

    window.addEventListener('keydown', handleKey);

    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate]);

  const data = overview.data;

  return (
    <main id="main-content" className="home-page">
      <div className="home-stage">
        <img className="pitch-decoration" src="/assets/pitch.svg" alt="" aria-hidden="true" />
        <section className="home-content" aria-labelledby="home-title">
          <Logo large />
          <div className="league-badge">
            <span className="status-dot" />
            Liga Fictícia 2026
            <span className="muted">
              ·{' '}
              {data?.leader
                ? `líder: ${data.leader.club_name}, ${data.leader.points} pontos`
                : 'Sua liga começa aqui'}
            </span>
          </div>
          <div className="home-titles">
            <h1 id="home-title">Gestão da liga, do mercado à classificação</h1>
            <p>
              Cadastre jogadores, monte os clubes e negocie com contrato de fidelidade. Depois,
              <br /> escale os titulares e jogue partidas com placar calculado pelos atributos.
            </p>
          </div>
          <div className="home-action">
            <Link className="button button-primary" to="/players">
              Iniciar
              <Icon name="arrow-right" />
            </Link>
            <span className="muted">
              ou tecle <kbd>Enter</kbd>
            </span>
          </div>
          {overview.isPending ? (
            <Message>Carregando números da liga…</Message>
          ) : overview.isError ? (
            <Message tone="error" onRetry={() => void overview.refetch()}>
              {overview.error.message}
            </Message>
          ) : (
            data && (
              <div className="league-numbers">
                <span>
                  <Icon name="count-players" />
                  <strong>{data.playerCount}</strong> jogadores
                </span>
                <span>
                  <Icon name="count-free" />
                  <strong>{data.freeCount}</strong> livres
                </span>
                <span>
                  <Icon name="count-clubs" />
                  <strong>{data.clubs.length}</strong> clubes
                </span>
                <span>
                  <Icon name="count-matches" />
                  <strong>{data.matchCount}</strong> partidas
                </span>
                <span>
                  <Icon name="no-login" />
                  Não precisa de login
                </span>
              </div>
            )
          )}
        </section>
        <section className="steps" aria-label="Como o sistema funciona">
          {steps.map((step, index) => (
            <Fragment key={step.title}>
              {index > 0 && <Icon name="step-next" className="step-arrow" />}
              <article className="step-card">
                <div className="step-top">
                  <span className="step-icon">
                    <Icon name={step.icon} />
                  </span>
                  <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <div>
                  <h2>{step.title}</h2>
                  <p>{step.text}</p>
                </div>
              </article>
            </Fragment>
          ))}
        </section>
        <footer className="home-footer">
          <Icon name="clock" />
          Liga Fictícia 2026 · Horário de Brasília (UTC−3)
        </footer>
      </div>
    </main>
  );
}
