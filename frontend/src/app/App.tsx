import { Link, Route, Routes } from 'react-router';

export function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <Routes>
        <Route
          path="/"
          element={
            <main id="main-content">
              <h1>Passe</h1>
              <p>Base da interface preparada para as próximas etapas.</p>
            </main>
          }
        />
        <Route
          path="*"
          element={
            <main id="main-content" className="not-found">
              <h1>Página não encontrada</h1>
              <Link to="/">Voltar ao início</Link>
            </main>
          }
        />
      </Routes>
    </>
  );
}
