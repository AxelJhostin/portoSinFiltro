export default function Paginacion({ pagina, total, limite, onChange, label, cargando = false }) {
  const totalPaginas = Math.max(1, Math.ceil(total / limite));
  if (totalPaginas <= 1 || cargando) return null;

  return (
    <nav
      className="flex justify-center items-center gap-2 mt-4"
      aria-label={label}
    >
      <button
        type="button"
        disabled={pagina === 1}
        onClick={() => onChange(pagina - 1)}
        className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px]
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1"
      >
        ← Anterior
      </button>
      <span className="font-mono text-sm text-ink-soft px-2 tabular-nums">
        {pagina} / {totalPaginas}
      </span>
      <button
        type="button"
        disabled={pagina === totalPaginas}
        onClick={() => onChange(pagina + 1)}
        className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px]
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1"
      >
        Siguiente →
      </button>
    </nav>
  );
}
