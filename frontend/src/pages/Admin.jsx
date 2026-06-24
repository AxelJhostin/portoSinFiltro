import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import Layout from '../components/layout/Layout';
import { ESTADO_LABEL, ESTADO_COLOR } from '../lib/constants';

export default function Admin({ session, perfil }) {
  const navigate = useNavigate();
  const [stats, setStats]           = useState(null);
  const [denuncias, setDenuncias]   = useState([]);
  const [reportes, setReportes]     = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [filtroOculta, setFiltro]   = useState('false');
  const [actualizando, setAct]      = useState(null);
  const [accionError, setAccionError] = useState('');

  useEffect(() => {
    if (!session) { navigate('/login', { replace: true }); return; }
    if (perfil?.rol !== 'administrador') {
      navigate('/', { replace: true });
    }
  }, [session, perfil, navigate]);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      try {
        const [s, d, r] = await Promise.all([
          api.dashboard.get(),
          api.admin.denuncias({ oculta: filtroOculta, pagina: 1 }),
          api.admin.reportes({ pagina: 1 }),
        ]);
        setStats(s);
        setDenuncias(d.data);
        setReportes(r.data);
      } catch {/* sin credenciales */}
      finally { setCargando(false); }
    }
    if (perfil?.rol === 'administrador') cargar();
  }, [filtroOculta, perfil?.rol]);

  async function toggleOculta(denuncia) {
    const nuevaOculta = !denuncia.oculta;
    setAct(denuncia.id);
    setAccionError('');
    try {
      await api.denuncias.ocultar(denuncia.id, { oculta: nuevaOculta });
      setDenuncias(prev =>
        prev.map(d => d.id === denuncia.id ? { ...d, oculta: nuevaOculta } : d)
      );
      if (stats) {
        setStats(s => ({
          ...s,
          ocultas: (s.ocultas ?? 0) + (nuevaOculta ? 1 : -1),
        }));
      }
    } catch (err) {
      setAccionError(err.message);
    } finally { setAct(null); }
  }

  if (!session || !perfil) return null;

  return (
    <Layout session={session} perfil={perfil}>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        <div>
          <h1 className="font-headline text-2xl sm:text-3xl text-ink">Moderación</h1>
          <p className="text-sm text-ink-soft mt-1">
            Revisa reportes de la comunidad y oculta denuncias falsas o abusivas.
          </p>
        </div>

        {accionError && (
          <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-brand-red" role="alert">
            {accionError}
          </div>
        )}

        {stats && (
          <section>
            <h2 className="font-headline text-lg mb-3">Resumen</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Visibles',    value: stats.total,              color: 'text-ink' },
                { label: 'Activas',     value: stats.estados.activa,     color: 'text-brand-red' },
                { label: 'Con avance',  value: stats.estados.con_avance, color: 'text-brand-amber' },
                { label: 'Resueltas',   value: stats.estados.resuelta,   color: 'text-brand-green' },
                { label: 'Ocultas',     value: stats.ocultas ?? 0,       color: 'text-ink-soft' },
                { label: 'Reportes',    value: stats.reportes ?? 0,      color: 'text-brand-red' },
              ].map(k => (
                <div key={k.label} className="card p-4 text-center">
                  <p className={`font-headline text-2xl sm:text-3xl ${k.color}`}>{k.value}</p>
                  <p className="text-xs text-ink-faint mt-1">{k.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reportes recientes */}
        <section>
          <h2 className="font-headline text-lg mb-3">Reportes recientes</h2>
          {cargando ? (
            <div className="card h-24 animate-pulse bg-surface-muted" />
          ) : reportes.length === 0 ? (
            <div className="card p-6 text-center text-ink-faint text-sm">
              No hay reportes de denuncias falsas.
            </div>
          ) : (
            <div className="space-y-3">
              {reportes.slice(0, 10).map(r => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/denuncia/${r.denuncia_id}`}
                        className="font-headline text-sm hover:text-brand-red transition-colors line-clamp-1"
                      >
                        {r.denuncia_titular || `Denuncia #${r.denuncia_id}`}
                      </Link>
                      <p className="text-xs text-ink-faint mt-0.5">
                        {r.zona} · {r.categoria} · por {r.reportado_por}
                      </p>
                      <p className="text-sm text-ink mt-2">{r.motivo}</p>
                    </div>
                    {r.denuncia_oculta && (
                      <span className="chip text-xs bg-surface-muted">Oculta</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Cola de denuncias */}
        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-headline text-lg">Denuncias</h2>
            <div className="flex gap-2 flex-wrap">
              {[
                { val: 'false', label: 'Visibles' },
                { val: 'true',  label: 'Ocultas' },
                { val: 'all',   label: 'Todas' },
              ].map(f => (
                <button
                  key={f.val}
                  onClick={() => setFiltro(f.val)}
                  className={`chip cursor-pointer transition-colors
                    ${filtroOculta === f.val ? 'chip-active' : 'hover:bg-surface-muted'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {cargando ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-surface-muted" />)}
            </div>
          ) : denuncias.length === 0 ? (
            <div className="card p-8 text-center text-ink-faint text-sm">
              No hay denuncias en este filtro.
            </div>
          ) : (
            <div className="space-y-3">
              {denuncias.map(d => (
                <div key={d.id} className={`card p-4 ${d.oculta ? 'opacity-75' : ''}`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`chip text-xs px-2 py-0.5 rounded-full ${ESTADO_COLOR[d.estado]}`}>
                          {ESTADO_LABEL[d.estado]}
                        </span>
                        {d.oculta && (
                          <span className="chip text-xs bg-surface-muted">OCULTA</span>
                        )}
                        {(d.total_reportes ?? 0) > 0 && (
                          <span className="chip text-xs text-brand-red border-red-200">
                            {d.total_reportes} reporte{d.total_reportes !== 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="text-xs text-ink-faint font-mono">
                          {d.zona} · {d.categoria}
                        </span>
                      </div>
                      <Link
                        to={`/denuncia/${d.id}`}
                        className="font-headline text-base hover:text-brand-red transition-colors line-clamp-1"
                      >
                        {d.titular}
                      </Link>
                      <p className="text-xs text-ink-soft mt-1 line-clamp-1">{d.descripcion}</p>
                    </div>

                    <button
                      onClick={() => toggleOculta(d)}
                      disabled={actualizando === d.id}
                      className={`shrink-0 text-xs py-1.5 px-3 rounded-card font-semibold
                        disabled:opacity-50 transition-all whitespace-nowrap
                        ${d.oculta
                          ? 'bg-brand-green text-white hover:brightness-95'
                          : 'bg-brand-red text-white hover:brightness-95'
                        }`}
                    >
                      {actualizando === d.id
                        ? '…'
                        : d.oculta ? 'Restaurar' : 'Ocultar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
