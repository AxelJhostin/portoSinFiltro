import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import Layout from '../components/layout/Layout';
import Paginacion from '../components/ui/Paginacion';
import { ESTADO_LABEL, ESTADO_COLOR } from '../lib/constants';

export default function Admin({ session, perfil }) {
  const navigate = useNavigate();
  const [stats, setStats]               = useState(null);
  const [denuncias, setDenuncias]         = useState([]);
  const [reportes, setReportes]           = useState([]);
  const [metaDenuncias, setMetaDenuncias] = useState({ total: 0, limite: 20 });
  const [metaReportes, setMetaReportes]   = useState({ total: 0, limite: 30 });
  const [paginaDenuncias, setPaginaDenuncias] = useState(1);
  const [paginaReportes, setPaginaReportes]   = useState(1);
  const [usuarios, setUsuarios]             = useState([]);
  const [metaUsuarios, setMetaUsuarios]       = useState({ total: 0, limite: 20 });
  const [paginaUsuarios, setPaginaUsuarios]     = useState(1);
  const [filtroRolUsuario, setFiltroRolUsuario] = useState('');
  const [filtroActivoUsuario, setFiltroActivoUsuario] = useState('');
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [cargandoStats, setCargandoStats]     = useState(true);
  const [cargandoDenuncias, setCargandoDenuncias] = useState(true);
  const [cargandoReportes, setCargandoReportes]   = useState(true);
  const [filtroOculta, setFiltro]         = useState('false');
  const [actualizando, setAct]            = useState(null);
  const [accionError, setAccionError]     = useState('');
  const [errorStats, setErrorStats]         = useState('');
  const [errorDenuncias, setErrorDenuncias] = useState('');
  const [errorReportes, setErrorReportes]   = useState('');
  const [errorUsuarios, setErrorUsuarios]   = useState('');
  const [reintentoStats, setReintentoStats]         = useState(0);
  const [reintentoDenuncias, setReintentoDenuncias] = useState(0);
  const [reintentoReportes, setReintentoReportes]   = useState(0);
  const [reintentoUsuarios, setReintentoUsuarios]   = useState(0);

  useEffect(() => {
    if (!session) { navigate('/login', { replace: true }); return; }
    // perfil llega en null mientras carga (ver App.jsx) — esperar a que
    // resuelva antes de decidir, si no un refresh en /admin saca al
    // administrador aunque su rol sí sea el correcto.
    if (perfil && perfil.rol !== 'administrador') {
      navigate('/', { replace: true });
    }
  }, [session, perfil, navigate]);

  useEffect(() => {
    if (perfil?.rol !== 'administrador') return;
    async function cargarStats() {
      setCargandoStats(true);
      setErrorStats('');
      try {
        setStats(await api.dashboard.get());
      } catch (err) { setErrorStats(err.message || 'No se pudo cargar el resumen.'); }
      finally { setCargandoStats(false); }
    }
    cargarStats();
  }, [perfil?.rol, reintentoStats]);

  useEffect(() => {
    if (perfil?.rol !== 'administrador') return;
    async function cargarDenuncias() {
      setCargandoDenuncias(true);
      setErrorDenuncias('');
      try {
        const res = await api.admin.denuncias({ oculta: filtroOculta, pagina: paginaDenuncias });
        setDenuncias(res.data);
        setMetaDenuncias({ total: res.total ?? 0, limite: res.limite ?? 20 });
      } catch (err) { setErrorDenuncias(err.message || 'No se pudieron cargar las denuncias.'); }
      finally { setCargandoDenuncias(false); }
    }
    cargarDenuncias();
  }, [filtroOculta, paginaDenuncias, perfil?.rol, reintentoDenuncias]);

  useEffect(() => {
    if (perfil?.rol !== 'administrador') return;
    async function cargarReportes() {
      setCargandoReportes(true);
      setErrorReportes('');
      try {
        const res = await api.admin.reportes({ pagina: paginaReportes });
        setReportes(res.data);
        setMetaReportes({ total: res.total ?? 0, limite: res.limite ?? 30 });
      } catch (err) { setErrorReportes(err.message || 'No se pudieron cargar los reportes.'); }
      finally { setCargandoReportes(false); }
    }
    cargarReportes();
  }, [paginaReportes, perfil?.rol, reintentoReportes]);

  useEffect(() => {
    if (perfil?.rol !== 'administrador') return;
    async function cargarUsuarios() {
      setCargandoUsuarios(true);
      setErrorUsuarios('');
      try {
        const params = { pagina: paginaUsuarios };
        if (filtroRolUsuario) params.rol = filtroRolUsuario;
        if (filtroActivoUsuario) params.activo = filtroActivoUsuario;
        const res = await api.admin.usuarios(params);
        setUsuarios(res.data);
        setMetaUsuarios({ total: res.total ?? 0, limite: res.limite ?? 20 });
      } catch (err) { setErrorUsuarios(err.message || 'No se pudieron cargar los usuarios.'); }
      finally { setCargandoUsuarios(false); }
    }
    cargarUsuarios();
  }, [paginaUsuarios, filtroRolUsuario, filtroActivoUsuario, perfil?.rol, reintentoUsuarios]);

  function cambiarFiltroOculta(val) {
    setFiltro(val);
    setPaginaDenuncias(1);
  }

  function cambiarFiltroUsuarios(tipo, val) {
    if (tipo === 'rol') setFiltroRolUsuario(val);
    if (tipo === 'activo') setFiltroActivoUsuario(val);
    setPaginaUsuarios(1);
  }

  async function toggleUsuarioActivo(usuario) {
    const nuevoActivo = !usuario.activo;
    if (!nuevoActivo && !window.confirm(`¿Desactivar la cuenta de ${usuario.nombre}? No podrá usar acciones que requieran login.`)) {
      return;
    }

    setAct(usuario.id);
    setAccionError('');
    try {
      const actualizado = await api.admin.setUsuarioActivo(usuario.id, nuevoActivo);
      setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, ...actualizado } : u));
    } catch (err) {
      setAccionError(err.message);
    } finally { setAct(null); }
  }

  function puedeToggleUsuario(usuario) {
    if (usuario.id === perfil?.id) return false;
    if (usuario.rol === 'administrador') return false;
    return true;
  }

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
            Revisa reportes, modera denuncias y gestiona cuentas de usuario.
          </p>
        </div>

        {accionError && (
          <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-brand-red" role="alert">
            {accionError}
          </div>
        )}

        {cargandoStats ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card h-20 animate-pulse bg-surface-muted" />
            ))}
          </div>
        ) : errorStats ? (
          <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-brand-red flex items-center justify-between gap-3 flex-wrap" role="alert">
            <span>No se pudo cargar el resumen: {errorStats}</span>
            <button onClick={() => setReintentoStats(n => n + 1)} className="btn-ghost shrink-0">Reintentar</button>
          </div>
        ) : stats && (
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
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-headline text-lg">Reportes recientes</h2>
            {!cargandoReportes && metaReportes.total > 0 && (
              <span className="text-xs font-mono text-ink-faint">
                {metaReportes.total} reporte{metaReportes.total !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {cargandoReportes ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="card h-24 animate-pulse bg-surface-muted" />)}
            </div>
          ) : errorReportes ? (
            <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-brand-red flex items-center justify-between gap-3 flex-wrap" role="alert">
              <span>No se pudieron cargar los reportes: {errorReportes}</span>
              <button onClick={() => setReintentoReportes(n => n + 1)} className="btn-ghost shrink-0">Reintentar</button>
            </div>
          ) : reportes.length === 0 ? (
            <div className="card p-6 text-center text-ink-faint text-sm">
              No hay reportes de denuncias falsas.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {reportes.map(r => (
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
              <Paginacion
                pagina={paginaReportes}
                total={metaReportes.total}
                limite={metaReportes.limite}
                onChange={setPaginaReportes}
                label="Paginación de reportes"
                cargando={cargandoReportes}
              />
            </>
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
                  onClick={() => cambiarFiltroOculta(f.val)}
                  className={`chip cursor-pointer transition-colors
                    ${filtroOculta === f.val ? 'chip-active' : 'hover:bg-surface-muted'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {cargandoDenuncias ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-surface-muted" />)}
            </div>
          ) : errorDenuncias ? (
            <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-brand-red flex items-center justify-between gap-3 flex-wrap" role="alert">
              <span>No se pudieron cargar las denuncias: {errorDenuncias}</span>
              <button onClick={() => setReintentoDenuncias(n => n + 1)} className="btn-ghost shrink-0">Reintentar</button>
            </div>
          ) : denuncias.length === 0 ? (
            <div className="card p-8 text-center text-ink-faint text-sm">
              No hay denuncias en este filtro.
            </div>
          ) : (
            <>
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
              <Paginacion
                pagina={paginaDenuncias}
                total={metaDenuncias.total}
                limite={metaDenuncias.limite}
                onChange={setPaginaDenuncias}
                label="Paginación de denuncias en moderación"
                cargando={cargandoDenuncias}
              />
            </>
          )}
        </section>

        {/* Gestión de usuarios */}
        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-headline text-lg">Usuarios</h2>
            <div className="flex gap-2 flex-wrap">
              {[
                { val: '', label: 'Todos los roles' },
                { val: 'ciudadano', label: 'Ciudadanos' },
                { val: 'administrador', label: 'Administradores' },
              ].map(f => (
                <button
                  key={f.val || 'all-roles'}
                  onClick={() => cambiarFiltroUsuarios('rol', f.val)}
                  className={`chip cursor-pointer transition-colors
                    ${filtroRolUsuario === f.val ? 'chip-active' : 'hover:bg-surface-muted'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mb-3">
            {[
              { val: '', label: 'Todos' },
              { val: 'true', label: 'Activos' },
              { val: 'false', label: 'Desactivados' },
            ].map(f => (
              <button
                key={f.val || 'all-status'}
                onClick={() => cambiarFiltroUsuarios('activo', f.val)}
                className={`chip cursor-pointer transition-colors
                  ${filtroActivoUsuario === f.val ? 'chip-active' : 'hover:bg-surface-muted'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {cargandoUsuarios ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="card h-16 animate-pulse bg-surface-muted" />)}
            </div>
          ) : errorUsuarios ? (
            <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-brand-red flex items-center justify-between gap-3 flex-wrap" role="alert">
              <span>No se pudieron cargar los usuarios: {errorUsuarios}</span>
              <button onClick={() => setReintentoUsuarios(n => n + 1)} className="btn-ghost shrink-0">Reintentar</button>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="card p-8 text-center text-ink-faint text-sm">
              No hay usuarios en este filtro.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {usuarios.map(u => (
                  <div key={u.id} className={`card p-4 ${!u.activo ? 'opacity-75' : ''}`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-headline text-base">{u.nombre}</span>
                          {u.id === perfil?.id && (
                            <span className="chip text-xs bg-surface-muted">Tú</span>
                          )}
                          <span className="chip text-xs capitalize">{u.rol}</span>
                          <span className={`chip text-xs ${u.activo ? 'text-brand-green border-green-200' : 'text-brand-red border-red-200'}`}>
                            {u.activo ? 'Activo' : 'Desactivado'}
                          </span>
                        </div>
                        {u.email && (
                          <p className="text-xs font-mono text-ink-faint truncate">{u.email}</p>
                        )}
                      </div>

                      {puedeToggleUsuario(u) ? (
                        <button
                          onClick={() => toggleUsuarioActivo(u)}
                          disabled={actualizando === u.id}
                          className={`shrink-0 text-xs py-1.5 px-3 rounded-card font-semibold
                            disabled:opacity-50 transition-all whitespace-nowrap
                            ${u.activo
                              ? 'bg-brand-red text-white hover:brightness-95'
                              : 'bg-brand-green text-white hover:brightness-95'
                            }`}
                        >
                          {actualizando === u.id ? '…' : u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      ) : (
                        <span className="text-xs text-ink-faint shrink-0">
                          {u.id === perfil?.id ? 'Tu cuenta' : 'Admin protegido'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Paginacion
                pagina={paginaUsuarios}
                total={metaUsuarios.total}
                limite={metaUsuarios.limite}
                onChange={setPaginaUsuarios}
                label="Paginación de usuarios"
                cargando={cargandoUsuarios}
              />
            </>
          )}
        </section>
      </div>
    </Layout>
  );
}
