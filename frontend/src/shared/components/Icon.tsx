export function Icon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <img src={`/assets/${name}.svg`} alt="" aria-hidden="true" className={`icon ${className}`} />
  );
}
