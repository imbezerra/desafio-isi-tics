import { Link, Route, Routes } from 'react-router';
import { HomePage } from '../features/home/HomePage';

export function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/players"
          element={
            <main id="main-content" className="not-found">
              <h1>Jogadores</h1>
              <p>A consulta de jogadores será disponibilizada na próxima etapa.</p>
              <Link to="/">Voltar ao início</Link>
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
