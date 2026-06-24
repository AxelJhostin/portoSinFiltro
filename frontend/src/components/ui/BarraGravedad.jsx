const SEGMENTO_COLOR = {
  1: 'bg-brand-green',
  2: 'bg-brand-green',
  3: 'bg-brand-yellow',
  4: 'bg-brand-amber',
  5: 'bg-brand-red',
};

const ALTURAS = {
  sm: 'h-3.5',
  md: 'h-4',
};

const TERMINAL = {
  sm: 'h-4 w-1.5',
  md: 'h-5 w-1.5',
};

export default function BarraGravedad({ nivel, size = 'sm', className = '' }) {
  const gravedad = Math.min(5, Math.max(1, Number(nivel) || 1));
  const altura = ALTURAS[size] ?? ALTURAS.sm;
  const terminal = TERMINAL[size] ?? TERMINAL.sm;

  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      role="meter"
      aria-valuenow={gravedad}
      aria-valuemin={1}
      aria-valuemax={5}
      aria-label={`Gravedad ${gravedad} de 5`}
    >
      <div
        className={`flex flex-1 gap-1 p-1 border border-surface-muted rounded-card bg-surface-base ${altura}`}
      >
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`flex-1 rounded-sm transition-colors duration-300 ease-out motion-reduce:transition-none
              ${i <= gravedad ? SEGMENTO_COLOR[i] : 'bg-surface-muted'}`}
          />
        ))}
      </div>
      {/* Terminal de pila */}
      <div
        className={`shrink-0 rounded-r-sm bg-surface-muted ${terminal}`}
        aria-hidden="true"
      />
    </div>
  );
}
