import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Layout from '../components/layout/Layout';
import DenunciaCard from '../components/ui/DenunciaCard';
import { ESTADO_LABEL } from '../lib/constants';

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

function SkeletonCard() {
  return (
    <div className="card overflow-hidden flex flex-row min-h-[9rem]" aria-hidden="true">
      <div className="skeleton-block w-28 sm:w-36 md:w-44 shrink-0 min-h-[9rem] rounded-none" />
      <div className="p-4 flex-1 space-y-3 min-w-0">
        <div className="flex justify-between gap-2">
          <div className="skeleton-block h-3 w-24" />
          <div className="skeleton-block h-5 w-20 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="skeleton-block h-4 w-full" />
          <div className="skeleton-block h-4 w-4/5" />
        </div>
        <div className="skeleton-block h-3 w-2/3" />
        <div className="skeleton-block h-1 w-full rounded-full" />
      </div>
    </div>
  );
}

export default function PanelPublico({ session, perfil }) {
  const navigate = useNavigate();
  const [stats, setStats]         = useState(null);
  const [denuncias, setDenuncias] = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [filtroEstado, setFiltro] = useState('activa');
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
                  { label: 'Activas',    value: stats.estados.activa,     color: 'text-brand-red' },
                  { label: 'Con avance', value: stats.estados.con_avance, color: 'text-brand-amber' },
                  { label: 'Resueltas',  value: stats.estados.resuelta,   color: 'text-brand-green' },
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

        <section className="max-w-3xl mx-auto w-full">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-headline text-lg">Denuncias</h2>
            <div className="flex gap-2 flex-wrap">
              {['activa', 'con_avance', 'resuelta'].map(e => (
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
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : denuncias.length === 0 ? (
            <div className="card p-8 text-center text-ink-soft text-sm">
              No hay denuncias en estado {ESTADO_LABEL[filtroEstado].toLowerCase()}.
            </div>
          ) : (
            <ul className="flex flex-col gap-4 list-none p-0 m-0">
              {denuncias.map(d => (
                <li key={d.id}>
                  <DenunciaCard
                    denuncia={d}
                    session={session}
                    onSelect={id => navigate(`/denuncia/${id}`)}
                  />
                </li>
              ))}
            </ul>
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
