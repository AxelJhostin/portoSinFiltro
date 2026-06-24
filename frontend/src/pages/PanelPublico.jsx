import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import Layout from '../components/layout/Layout';
import BarraGravedad from '../components/ui/BarraGravedad';
import { ESTADO_LABEL, ESTADO_COLOR, GRAVEDAD_LABEL } from '../lib/constants';

function RankingBarras({ items, colorClass = 'bg-brand-red' }) {
  if (!items?.length) return null;
  const max = items[0].total;
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={item.nombre} className="flex items-center gap-3">
          <span className="font-mono text-xs text-ink-soft w-4">{i + 1}</span>
          <span className="text-sm w-36 sm:w-44 shrink-0 truncate">{item.nombre}</span>
          <div className="flex-1 bg-surface-muted rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${colorClass}`}
              style={{ width: `${max ? (item.total / max) * 100 : 0}%` }}
            />
          </div>
          <span className="font-mono text-xs text-ink-soft w-8 text-right tabular-nums">{item.total}</span>
        </div>
      ))}
    </div>
  );
}

function TendenciaSemanal({ tendencia }) {
  if (!tendencia?.length) return null;
  const max = Math.max(...tendencia.map(d => d.total), 1);

  return (
    <div className="flex items-end gap-2 h-24">
      {tendencia.map(({ fecha, total }) => {
        const dia = new Date(fecha + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'short' });
        return (
          <div key={fecha} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="font-mono text-xs text-ink-soft tabular-nums">{total}</span>
            <div className="w-full bg-surface-muted rounded-t-card flex items-end h-16 overflow-hidden">
              <div
                className="w-full bg-brand-amber rounded-t-card transition-all"
                style={{ height: `${(total / max) * 100}%`, minHeight: total > 0 ? '4px' : 0 }}
              />
            </div>
            <span className="text-[10px] text-ink-faint uppercase truncate w-full text-center">{dia}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function PanelPublico({ session, perfil }) {
  const [stats, setStats]         = useState(null);
  const [denuncias, setDenuncias] = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [filtroEstado, setFiltro] = useState('pendiente');
  const [error, setError]         = useState(null);

  useEffect(() => {
    async function cargarStats() {
      try {
        const s = await api.dashboard.public();
        setStats(s);
        setError(null);
      } catch {
        setError('No se pudieron cargar las estadísticas.');
      }
    }
    cargarStats();
  }, []);

  useEffect(() => {
    async function cargarDenuncias() {
      setCargando(true);
      try {
        const d = await api.denuncias.list({ estado: filtroEstado, orden: 'reciente', pagina: 1 });
        setDenuncias(d.data);
      } catch {
        setDenuncias([]);
      } finally {
        setCargando(false);
      }
    }
    cargarDenuncias();
  }, [filtroEstado]);

  return (
    <Layout session={session} perfil={perfil} back>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl text-ink text-balance">Panel público</h1>
          <p className="text-sm text-ink-soft mt-1.5 max-w-2xl text-pretty">
            Estadísticas abiertas de Portoviejo. Solo consulta — no se pueden modificar denuncias desde aquí.
          </p>
        </div>

        {error && (
          <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-ink" role="alert">
            {error}
          </div>
        )}

        {stats && (
          <>
            <section>
              <h2 className="font-headline text-lg mb-3">Resumen general</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total',      value: stats.total,              color: 'text-ink' },
                  { label: 'Pendientes', value: stats.estados.pendiente,  color: 'text-brand-red' },
                  { label: 'En proceso', value: stats.estados.en_proceso, color: 'text-brand-amber' },
                  { label: 'Resueltas',  value: stats.estados.resuelto,   color: 'text-brand-green' },
                ].map(k => (
                  <div key={k.label} className="card p-4 text-center">
                    <p className={`font-headline text-3xl tabular-nums ${k.color}`}>{k.value}</p>
                    <p className="text-xs text-ink-soft mt-1">{k.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {stats.zonas?.length > 0 && (
              <section>
                <h2 className="font-headline text-lg mb-3">Zonas con más denuncias</h2>
                <div className="card p-4">
                  <RankingBarras items={stats.zonas} />
                </div>
              </section>
            )}

            {stats.categorias?.length > 0 && (
              <section>
                <h2 className="font-headline text-lg mb-3">Categorías más reportadas</h2>
                <div className="card p-4">
                  <RankingBarras items={stats.categorias} colorClass="bg-brand-amber" />
                </div>
              </section>
            )}

            {stats.tendencia?.length > 0 && (
              <section>
                <h2 className="font-headline text-lg mb-3">Denuncias esta semana</h2>
                <div className="card p-4">
                  <TendenciaSemanal tendencia={stats.tendencia} />
                </div>
              </section>
            )}
          </>
        )}

        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-headline text-lg">Denuncias</h2>
            <div className="flex gap-2 flex-wrap">
              {['pendiente', 'en_proceso', 'resuelto'].map(e => (
                <button
                  key={e}
                  type="button"
                  aria-pressed={filtroEstado === e}
                  onClick={() => setFiltro(e)}
                  className={`chip cursor-pointer transition-colors
                    ${filtroEstado === e ? 'chip-active' : 'hover:bg-surface-muted'}`}
                >
                  {ESTADO_LABEL[e]}
                </button>
              ))}
            </div>
          </div>

          {cargando ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="card overflow-hidden flex flex-row min-h-[9rem] animate-pulse">
                  <div className="w-28 sm:w-40 md:w-48 shrink-0 bg-surface-muted" />
                  <div className="flex-1 p-4 space-y-3">
                    <div className="h-4 w-1/3 bg-surface-muted rounded" />
                    <div className="h-5 w-2/3 bg-surface-muted rounded" />
                    <div className="h-3 w-full bg-surface-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : denuncias.length === 0 ? (
            <div className="card p-8 text-center text-ink-soft text-sm">
              No hay denuncias en estado {ESTADO_LABEL[filtroEstado].toLowerCase()}.
            </div>
          ) : (
            <div className="space-y-3">
              {denuncias.map(d => (
                <Link
                  key={d.id}
                  to={`/denuncia/${d.id}`}
                  className="card block overflow-hidden hover:shadow-md transition-shadow group
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
                >
                  <div className="flex flex-row min-h-[9rem]">
                    {/* Columna visual — siempre ocupa el mismo ancho */}
                    <div className="w-28 sm:w-40 md:w-48 shrink-0 self-stretch bg-surface-muted overflow-hidden">
                      {d.foto_portada ? (
                        <img
                          src={d.foto_portada}
                          alt=""
                          className="w-full h-full min-h-[9rem] object-cover transition-transform duration-300 ease-out
                                     group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full min-h-[9rem] flex items-center justify-center px-2">
                          <span className="text-[10px] font-mono text-ink-faint uppercase tracking-wide text-center">
                            Sin foto
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Contenido + métricas */}
                    <div className="flex-1 min-w-0 p-4 flex flex-col">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                        <span className={`chip text-xs px-2 py-0.5 rounded-full ${ESTADO_COLOR[d.estado]}`}>
                          {ESTADO_LABEL[d.estado]}
                        </span>
                        <span className="text-xs text-ink-soft font-mono truncate">{d.zona}</span>
                        <span className="text-xs text-ink-faint hidden sm:inline">·</span>
                        <span className="text-xs text-ink-soft truncate">{d.categoria}</span>
                      </div>

                      <div className="flex flex-1 gap-4 flex-col sm:flex-row sm:items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-headline text-base sm:text-lg leading-snug line-clamp-2 text-balance group-hover:text-brand-red transition-colors">
                            {d.titular}
                          </p>
                          <p className="text-sm text-ink-soft mt-1.5 line-clamp-2 sm:line-clamp-3 text-pretty">
                            {d.descripcion}
                          </p>
                        </div>

                        <div className="flex sm:flex-col gap-4 sm:gap-3 sm:items-end sm:text-right shrink-0
                                        border-t sm:border-t-0 sm:border-l border-surface-muted pt-3 sm:pt-0 sm:pl-4 sm:w-32">
                          {[
                            { value: d.total_apoyos,  label: 'apoyos' },
                            { value: d.total_aportes, label: 'aportes' },
                            { value: d.dias_sin_resolver, label: 'días' },
                          ].map(m => (
                            <div key={m.label}>
                              <p className="font-headline text-xl sm:text-2xl tabular-nums leading-none">{m.value}</p>
                              <p className="text-[11px] text-ink-faint mt-0.5">{m.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <BarraGravedad nivel={d.gravedad} className="flex-1 min-w-0" />
                        <span className="text-xs font-mono text-ink-soft shrink-0 w-14 text-right">
                          {GRAVEDAD_LABEL[d.gravedad]}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <p className="text-xs text-ink-faint text-center mt-4">
            ¿Quieres reportar un problema?{' '}
            {session && perfil?.rol === 'ciudadano' ? (
              <Link to="/nueva" className="text-brand-red font-semibold hover:underline">Crear denuncia</Link>
            ) : session ? (
              <Link to="/" className="text-brand-red font-semibold hover:underline">Ver el muro</Link>
            ) : (
              <Link to="/login" className="text-brand-red font-semibold hover:underline">Ingresar</Link>
            )}
          </p>
        </section>
      </div>
    </Layout>
  );
}
