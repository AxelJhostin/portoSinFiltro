import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import Layout from '../components/layout/Layout';
import { ESTADO_LABEL, ESTADO_COLOR } from '../lib/constants';

const ESTADO_NEXT       = { pendiente:'en_proceso', en_proceso:'resuelto', resuelto:null };
const ESTADO_NEXT_LABEL = { pendiente:'Marcar en proceso →', en_proceso:'Marcar resuelto →', resuelto:null };

export default function Panel({ session, perfil }) {
  const navigate = useNavigate();
  const [stats, setStats]         = useState(null);
  const [denuncias, setDenuncias] = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [filtroEstado, setFiltro] = useState('pendiente');
  const [respuesta, setRespuesta] = useState({});
  const [actualizando, setAct]    = useState(null);

  useEffect(() => {
    if (!session) { navigate('/login', { replace: true }); return; }
    if (perfil && !['municipio', 'cuadrilla'].includes(perfil.rol)) {
      navigate('/', { replace: true });
    }
  }, [session, perfil, navigate]);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      try {
        const [s, d] = await Promise.all([
          api.dashboard.get(),
          api.denuncias.list({ estado: filtroEstado, orden: 'reciente', pagina: 1 }),
        ]);
        setStats(s);
        setDenuncias(d.data);
      } catch {/* sin credenciales aún */}
      finally { setCargando(false); }
    }
    cargar();
  }, [filtroEstado]);

  async function cambiarEstado(denuncia) {
    const nuevoEstado = ESTADO_NEXT[denuncia.estado];
    if (!nuevoEstado) return;
    setAct(denuncia.id);
    try {
      await api.denuncias.estado(denuncia.id, {
        estado: nuevoEstado,
        respuesta: respuesta[denuncia.id] || undefined,
      });
      setDenuncias(prev =>
        prev.map(d => d.id === denuncia.id ? { ...d, estado: nuevoEstado } : d)
      );
      setRespuesta(r => { const c = { ...r }; delete c[denuncia.id]; return c; });
    } catch {/* error silencioso */}
    finally { setAct(null); }
  }

  if (!session || !perfil) return null;

  return (
    <Layout session={session} perfil={perfil}>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* KPIs */}
        {stats && (
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
                  <p className={`font-headline text-3xl ${k.color}`}>{k.value}</p>
                  <p className="text-xs text-ink-faint mt-1">{k.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Top zonas */}
        {stats?.zonas?.length > 0 && (
          <section>
            <h2 className="font-headline text-lg mb-3">Zonas con más denuncias</h2>
            <div className="card p-4 space-y-2">
              {stats.zonas.map((z, i) => {
                const max = stats.zonas[0].total;
                return (
                  <div key={z.nombre} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-ink-faint w-4">{i + 1}</span>
                    <span className="text-sm w-40 shrink-0">{z.nombre}</span>
                    <div className="flex-1 bg-surface-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-brand-red rounded-full transition-all"
                        style={{ width: `${(z.total / max) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-ink-faint w-8 text-right">{z.total}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tabla de denuncias */}
        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-headline text-lg">Denuncias</h2>
            <div className="flex gap-2">
              {['pendiente', 'en_proceso', 'resuelto'].map(e => (
                <button
                  key={e}
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
              {[1,2,3].map(i => <div key={i} className="card h-20 animate-pulse bg-surface-muted" />)}
            </div>
          ) : denuncias.length === 0 ? (
            <div className="card p-8 text-center text-ink-faint text-sm">
              No hay denuncias en estado {ESTADO_LABEL[filtroEstado].toLowerCase()}.
            </div>
          ) : (
            <div className="space-y-3">
              {denuncias.map(d => (
                <div key={d.id} className="card p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`chip text-xs px-2 py-0.5 rounded-full ${ESTADO_COLOR[d.estado]}`}>
                          {ESTADO_LABEL[d.estado]}
                        </span>
                        <span className="text-xs text-ink-faint font-mono">
                          {d.zona} · {d.categoria} · {d.dias_sin_resolver}d
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

                    {ESTADO_NEXT[d.estado] && (
                      <div className="shrink-0 flex flex-col gap-2 items-end">
                        <input
                          type="text"
                          placeholder="Respuesta oficial (opcional)"
                          value={respuesta[d.id] || ''}
                          onChange={e => setRespuesta(r => ({ ...r, [d.id]: e.target.value }))}
                          className="text-xs border border-surface-muted rounded-card px-2 py-1
                                     focus:outline-none focus:border-ink w-52"
                        />
                        <button
                          onClick={() => cambiarEstado(d)}
                          disabled={actualizando === d.id}
                          className="btn-primary text-xs py-1.5 disabled:opacity-50 whitespace-nowrap"
                        >
                          {actualizando === d.id ? '…' : ESTADO_NEXT_LABEL[d.estado]}
                        </button>
                      </div>
                    )}
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
