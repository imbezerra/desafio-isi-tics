import { Link } from 'react-router';
export function Logo({ large = false }: { large?: boolean }) {
  return (
    <Link to="/" className={`logo ${large ? 'logo-large' : ''}`} aria-label="Passe, página inicial">
      <img src={`/assets/logo-${large ? 'large' : 'small'}.svg`} alt="" />
      <span>
        <strong>Passe</strong>
        {!large && <small>Gestão da liga</small>}
      </span>
    </Link>
  );
}
