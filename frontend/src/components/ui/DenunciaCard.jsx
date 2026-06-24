import { useState } from 'react';
import { api } from '../../lib/api';
import { ESTADO_LABEL, ESTADO_COLOR } from '../../lib/constants';
import BarraGravedad from './BarraGravedad';

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

  function abrirDetalle() {
    onSelect(denuncia.id);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      abrirDetalle();
    }
  }

  const fotoUrl = denuncia.foto_portada ?? null;
  const tieneUbicacion = denuncia.latitud != null && denuncia.longitud != null;
  const diasLabel = denuncia.dias_sin_resolver === 1
    ? '1 día sin solución'
    : `${denuncia.dias_sin_resolver}d sin solución`;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={abrirDetalle}
      onKeyDown={onKeyDown}
      aria-label={`Denuncia: ${denuncia.titular}. ${denuncia.zona}. ${ESTADO_LABEL[denuncia.estado]}.`}
      className={`card-interactive overflow-hidden group flex min-h-[9rem]
        ${fotoUrl ? 'flex-row' : 'flex-col'}`}
    >
      {fotoUrl && (
        <div className="w-28 sm:w-36 md:w-44 shrink-0 bg-surface-muted overflow-hidden self-stretch">
          <img
            src={fotoUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full min-h-[9rem] object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </div>
      )}

      <div className="p-4 flex flex-col flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs font-mono text-ink-soft uppercase tracking-wide truncate">
            {denuncia.zona}
          </span>
          <span className={`chip shrink-0 text-xs px-2 py-0.5 rounded-full ${ESTADO_COLOR[denuncia.estado]}`}>
            {ESTADO_LABEL[denuncia.estado]}
          </span>
        </div>

        <h2 className="font-headline text-base sm:text-lg leading-snug mb-1.5 group-hover:text-brand-red transition-colors line-clamp-2 text-balance">
          {denuncia.titular}
        </h2>

        <p className="text-sm text-ink-soft line-clamp-2 sm:line-clamp-3 mb-3 flex-1 text-pretty">
          {denuncia.descripcion}
        </p>

        <div className="flex items-center justify-between gap-2 text-xs text-ink-soft mt-auto">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="chip truncate max-w-[9rem]">{denuncia.categoria}</span>
            <span className="whitespace-nowrap">{diasLabel}</span>
            {tieneUbicacion && (
              <span className="font-mono text-ink-soft" title="Ubicación en mapa">
                Mapa
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={toggleApoyo}
            disabled={!session}
            aria-pressed={apoyado}
            aria-label={session
              ? (apoyado ? 'Quitar apoyo' : 'Apoyar denuncia')
              : `${apoyos} apoyos. Inicia sesión para apoyar.`}
            title={!session ? 'Inicia sesión para apoyar' : undefined}
            className={`flex items-center gap-1 font-semibold shrink-0 min-h-[32px] px-1 transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1 rounded
              ${apoyado ? 'text-brand-red' : 'text-ink-soft hover:text-brand-red'}
              ${!session ? 'cursor-default opacity-70' : ''}`}
          >
            <span aria-hidden="true">{apoyado ? '▲' : '△'}</span>
            <span>{apoyos}</span>
          </button>
        </div>

        <BarraGravedad nivel={denuncia.gravedad} className="mt-2.5" />
      </div>
    </article>
  );
}
