import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import DenunciaCard from '../components/ui/DenunciaCard';
import Layout from '../components/layout/Layout';
import { CATEGORIAS, ZONAS, ESTADO_LABEL } from '../lib/constants';

const ORDEN_OPTS = [
  { value: 'reciente', label: 'Más reciente' },
  { value: 'apoyos',   label: 'Más apoyado' },
  { value: 'gravedad', label: 'Más grave' },
];

const ESTADO_OPTS = [
  { value: '',           label: 'Todas' },
  { value: 'activa',     label: ESTADO_LABEL.activa },
  { value: 'con_avance', label: ESTADO_LABEL.con_avance },
  { value: 'resuelta',   label: ESTADO_LABEL.resuelta },
];

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

export default function Muro({ session, perfil }) {
  const [denuncias, setDenuncias] = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState(null);
  const [orden, setOrden]           = useState('reciente');
  const [zonaId, setZonaId]         = useState('');
  const [catId, setCatId]           = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [pagina, setPagina]         = useState(1);
  const [total, setTotal]           = useState(0);
  const navigate = useNavigate();

  const hayFiltros = Boolean(zonaId || catId || filtroEstado);
  const zonaNombre = ZONAS.find(z => String(z.id) === zonaId)?.nombre;
  const catNombre = CATEGORIAS.find(c => String(c.id) === catId)?.nombre;

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = { orden, pagina };
      if (zonaId) params.zona_id = zonaId;
      if (catId)  params.categoria_id = catId;
      if (filtroEstado) params.estado = filtroEstado;
      const res = await api.denuncias.list(params);
      setDenuncias(res.data);
      setTotal(res.total);
    } catch {
      setError('No se pudieron cargar las denuncias. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }, [orden, zonaId, catId, filtroEstado, pagina]);

  useEffect(() => { cargar(); }, [cargar]);

  function cambiarFiltro(fn) {
    fn();
    setPagina(1);
  }

  function limpiarFiltros() {
    cambiarFiltro(() => { setZonaId(''); setCatId(''); setFiltroEstado(''); });
  }

  const totalPaginas = Math.ceil(total / 20);

  return (
    <Layout session={session} perfil={perfil}>
      {/* Encabezado editorial — breve, la denuncia es protagonista */}
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-4">
        <h1 className="font-headline text-2xl sm:text-3xl tracking-wide text-ink text-balance">
          El muro
        </h1>
        <p className="text-sm text-ink-soft mt-1.5 max-w-xl text-pretty">
          Denuncias ciudadanas en Portoviejo. Ordena, filtra y apoya lo que importa en tu barrio.
        </p>
      </div>

      {/* Barra de filtros */}
      <div
        className="border-y border-surface-muted bg-surface-card sticky top-0 z-10"
        role="search"
        aria-label="Filtrar denuncias"
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
          {/* Orden */}
          <fieldset className="flex flex-wrap items-center gap-1.5 min-w-0 border-0 p-0 m-0">
            <legend className="sr-only">Ordenar por</legend>
            {ORDEN_OPTS.map(o => (
              <button
                key={o.value}
                type="button"
                aria-pressed={orden === o.value}
                onClick={() => cambiarFiltro(() => setOrden(o.value))}
                className={`chip cursor-pointer transition-colors min-h-[36px] px-3
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1
                  ${orden === o.value ? 'chip-active' : 'hover:bg-surface-muted'}`}
              >
                {o.label}
              </button>
            ))}
          </fieldset>

          <fieldset className="flex flex-wrap items-center gap-1.5 min-w-0 border-0 p-0 m-0">
            <legend className="sr-only">Filtrar por estado</legend>
            {ESTADO_OPTS.map(e => (
              <button
                key={e.value || 'todas'}
                type="button"
                aria-pressed={filtroEstado === e.value}
                onClick={() => cambiarFiltro(() => setFiltroEstado(e.value))}
                className={`chip cursor-pointer transition-colors min-h-[36px] px-3
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1
                  ${filtroEstado === e.value ? 'chip-active' : 'hover:bg-surface-muted'}`}
              >
                {e.label}
              </button>
            ))}
          </fieldset>

          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <label className="sr-only" htmlFor="filtro-zona">Zona</label>
            <select
              id="filtro-zona"
              value={zonaId}
              onChange={e => cambiarFiltro(() => setZonaId(e.target.value))}
              className="filter-select"
            >
              <option value="">Todas las zonas</option>
              {ZONAS.map(z => (
                <option key={z.id} value={z.id}>{z.nombre}</option>
              ))}
            </select>

            <label className="sr-only" htmlFor="filtro-categoria">Categoría</label>
            <select
              id="filtro-categoria"
              value={catId}
              onChange={e => cambiarFiltro(() => setCatId(e.target.value))}
              className="filter-select"
            >
              <option value="">Todas las categorías</option>
              {CATEGORIAS.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumen de filtros activos + conteo */}
        <div className="max-w-3xl mx-auto px-4 pb-3 flex flex-wrap items-center gap-2">
          {hayFiltros && (
            <div className="flex flex-wrap items-center gap-2">
              {zonaNombre && (
                <span className="chip text-ink-soft">
                  {zonaNombre}
                  <button
                    type="button"
                    onClick={() => cambiarFiltro(() => setZonaId(''))}
                    className="ml-0.5 text-ink-faint hover:text-brand-red transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink rounded"
                    aria-label={`Quitar filtro de zona ${zonaNombre}`}
                  >
                    ×
                  </button>
                </span>
              )}
              {catNombre && (
                <span className="chip text-ink-soft">
                  {catNombre}
                  <button
                    type="button"
                    onClick={() => cambiarFiltro(() => setCatId(''))}
                    className="ml-0.5 text-ink-faint hover:text-brand-red transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink rounded"
                    aria-label={`Quitar filtro de categoría ${catNombre}`}
                  >
                    ×
                  </button>
                </span>
              )}
              {filtroEstado && (
                <span className="chip text-ink-soft">
                  {ESTADO_LABEL[filtroEstado]}
                  <button
                    type="button"
                    onClick={() => cambiarFiltro(() => setFiltroEstado(''))}
                    className="ml-0.5 text-ink-faint hover:text-brand-red transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink rounded"
                    aria-label={`Quitar filtro de estado ${ESTADO_LABEL[filtroEstado]}`}
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-xs text-ink-soft hover:text-brand-red transition-colors underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink rounded"
              >
                Limpiar todo
              </button>
            </div>
          )}

          <p
            className="text-xs text-ink-soft font-mono sm:ml-auto"
            aria-live="polite"
            aria-atomic="true"
          >
            {cargando ? 'Cargando…' : `${total} denuncia${total !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Lista vertical de denuncias */}
      <div className="max-w-3xl mx-auto w-full px-4 py-6">
        {error && !cargando && (
          <div
            className="rounded-card border border-red-200 bg-red-50 px-4 py-4 text-center mb-6"
            role="alert"
          >
            <p className="text-sm text-ink mb-3">{error}</p>
            <button type="button" onClick={cargar} className="btn-ghost">
              Reintentar
            </button>
          </div>
        )}

        {cargando ? (
          <div
            className="flex flex-col gap-4"
            aria-busy="true"
            aria-label="Cargando denuncias"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : denuncias.length === 0 && !error ? (
          <div className="text-center py-16 sm:py-20 max-w-md mx-auto">
            <p className="font-headline text-2xl text-ink mb-2 text-balance">
              {hayFiltros ? 'Sin resultados' : 'El muro está vacío'}
            </p>
            <p className="text-sm text-ink-soft mb-6 text-pretty">
              {hayFiltros
                ? 'Ninguna denuncia coincide con los filtros seleccionados. Prueba ampliar la búsqueda.'
                : 'Sé la primera persona en reportar un problema en tu barrio.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {hayFiltros && (
                <button type="button" onClick={limpiarFiltros} className="btn-ghost">
                  Ver todas
                </button>
              )}
              {session && (
                <Link to="/nueva" className="btn-primary">
                  + Denunciar
                </Link>
              )}
              {!session && (
                <Link to="/login" className="btn-primary">
                  Ingresar para denunciar
                </Link>
              )}
            </div>
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

        {/* Paginación */}
        {totalPaginas > 1 && !cargando && (
          <nav
            className="flex justify-center items-center gap-2 mt-10"
            aria-label="Paginación de denuncias"
          >
            <button
              type="button"
              disabled={pagina === 1}
              onClick={() => setPagina(p => p - 1)}
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
              onClick={() => setPagina(p => p + 1)}
              className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1"
            >
              Siguiente →
            </button>
          </nav>
        )}
      </div>
    </Layout>
  );
}
