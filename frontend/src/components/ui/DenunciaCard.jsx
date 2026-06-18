import { useState } from 'react';
import { api } from '../../lib/api';
import { ESTADO_LABEL, ESTADO_COLOR } from '../../lib/constants';

export default function DenunciaCard({ denuncia, session, onSelect }) {
  const [apoyos, setApoyos] = useState(denuncia.total_apoyos);
  const [apoyado, setApoyado] = useState(false);

  async function toggleApoyo(e) {
    e.stopPropagation();
    if (!session) return;
    try {
      const { apoyo } = await api.denuncias.apoyo(denuncia.id);
      setApoyado(apoyo);
      setApoyos(n => apoyo ? n + 1 : n - 1);
    } catch {/* silencioso */}
  }

  return (
    <article
      onClick={() => onSelect(denuncia.id)}
      className="card p-4 cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-ink-faint uppercase tracking-wide">
          {denuncia.zona}
        </span>
        <span className={`chip text-xs px-2 py-0.5 rounded-full ${ESTADO_COLOR[denuncia.estado]}`}>
          {ESTADO_LABEL[denuncia.estado]}
        </span>
      </div>

      <h2 className="font-headline text-base leading-tight mb-2 group-hover:text-brand-red transition-colors line-clamp-2">
        {denuncia.titular}
      </h2>

      <p className="text-sm text-ink-soft line-clamp-2 mb-3">
        {denuncia.descripcion}
      </p>

      <div className="flex items-center justify-between text-xs text-ink-faint">
        <div className="flex items-center gap-2">
          <span className="chip">{denuncia.categoria}</span>
          <span>{denuncia.dias_sin_resolver}d sin solución</span>
        </div>

        <button
          onClick={toggleApoyo}
          disabled={!session}
          className={`flex items-center gap-1 font-semibold transition-colors
            ${apoyado ? 'text-brand-red' : 'text-ink-faint hover:text-brand-red'}
            ${!session ? 'cursor-default' : ''}`}
        >
          <span>{apoyado ? '▲' : '△'}</span>
          <span>{apoyos}</span>
        </button>
      </div>

      <div className="mt-3 h-1 bg-surface-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-red rounded-full transition-all"
          style={{ width: `${(denuncia.gravedad / 5) * 100}%` }}
        />
      </div>
    </article>
  );
}
