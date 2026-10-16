import { Link, Route, Routes } from 'react-router';
import { HomePage } from '../features/home/HomePage';
import { PlayersPage } from '../features/players/PlayersPage';
import { ClubsPage } from '../features/clubs/ClubsPage';
import { ClubPage } from '../features/clubs/ClubPage';

export function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/clubs" element={<ClubsPage />} />
        <Route path="/clubs/:id" element={<ClubPage />} />
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
