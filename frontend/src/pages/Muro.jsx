import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import DenunciaCard from '../components/ui/DenunciaCard';
import Layout from '../components/layout/Layout';

const ORDEN_OPTS = [
  { value: 'reciente', label: 'Más reciente' },
  { value: 'apoyos',   label: 'Más apoyado' },
  { value: 'gravedad', label: 'Más grave' },
];

const CATEGORIAS = [
  { id: 1, nombre: 'Baches y vías' },
  { id: 2, nombre: 'Alumbrado público' },
  { id: 3, nombre: 'Basura y aseo' },
  { id: 4, nombre: 'Agua y alcantarillado' },
  { id: 5, nombre: 'Semáforos y señalética' },
  { id: 6, nombre: 'Parques y espacios públicos' },
  { id: 7, nombre: 'Seguridad' },
  { id: 8, nombre: 'Ruido' },
  { id: 9, nombre: 'Otros' },
];

const ZONAS = [
  { id: 1,  nombre: 'Andrés de Vera' },
  { id: 2,  nombre: 'Picoazá' },
  { id: 3,  nombre: '4 de Noviembre' },
  { id: 4,  nombre: 'San Pablo' },
  { id: 5,  nombre: 'El Florón' },
  { id: 6,  nombre: 'Colón' },
  { id: 7,  nombre: 'La Pradera' },
  { id: 8,  nombre: 'Ciudad Nueva' },
  { id: 9,  nombre: 'Ciudadela Universitaria' },
  { id: 10, nombre: 'Otra zona' },
];

export default function Muro({ session, perfil }) {
  const [denuncias, setDenuncias] = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [orden, setOrden]         = useState('reciente');
  const [zonaId, setZonaId]       = useState('');
  const [catId, setCatId]         = useState('');
  const [pagina, setPagina]       = useState(1);
  const [total, setTotal]         = useState(0);
  const navigate = useNavigate();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = { orden, pagina };
      if (zonaId) params.zona_id = zonaId;
      if (catId)  params.categoria_id = catId;
      const res = await api.denuncias.list(params);
      setDenuncias(res.data);
      setTotal(res.total);
    } catch {
      // mantener datos anteriores en error transitorio
    } finally {
      setCargando(false);
    }
  }, [orden, zonaId, catId, pagina]);

  useEffect(() => { cargar(); }, [cargar]);

  // Resetear página cuando cambian filtros
  function cambiarFiltro(fn) {
    fn();
    setPagina(1);
  }

  const totalPaginas = Math.ceil(total / 20);

  return (
    <Layout session={session} perfil={perfil}>
      {/* Barra de filtros */}
      <div className="border-b border-surface-muted bg-surface-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-2 flex flex-wrap items-center gap-2">
          {/* Orden */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-faint font-mono hidden sm:block">ORDEN:</span>
            {ORDEN_OPTS.map(o => (
              <button
                key={o.value}
                onClick={() => cambiarFiltro(() => setOrden(o.value))}
                className={`chip cursor-pointer transition-colors
                  ${orden === o.value ? 'chip-active' : 'hover:bg-surface-muted'}`}
              >
                {o.label}
              </button>
            ))}
          </div>

          <span className="text-surface-muted hidden sm:block">|</span>

          {/* Filtro zona */}
          <select
            value={zonaId}
            onChange={e => cambiarFiltro(() => setZonaId(e.target.value))}
            className="text-xs border border-surface-muted rounded-card px-2 py-1
                       focus:outline-none focus:border-ink bg-white text-ink"
          >
            <option value="">Todas las zonas</option>
            {ZONAS.map(z => (
              <option key={z.id} value={z.id}>{z.nombre}</option>
            ))}
          </select>

          {/* Filtro categoría */}
          <select
            value={catId}
            onChange={e => cambiarFiltro(() => setCatId(e.target.value))}
            className="text-xs border border-surface-muted rounded-card px-2 py-1
                       focus:outline-none focus:border-ink bg-white text-ink"
          >
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>

          {/* Limpiar filtros */}
          {(zonaId || catId) && (
            <button
              onClick={() => cambiarFiltro(() => { setZonaId(''); setCatId(''); })}
              className="text-xs text-ink-faint hover:text-brand-red transition-colors"
            >
              × Limpiar
            </button>
          )}

          <span className="ml-auto text-xs text-ink-faint font-mono">
            {total} denuncia{total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto w-full px-4 py-6">
        {cargando ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card h-44 animate-pulse bg-surface-muted" />
            ))}
          </div>
        ) : denuncias.length === 0 ? (
          <div className="text-center py-20 text-ink-faint">
            <p className="font-headline text-2xl mb-2">Sin denuncias</p>
            <p className="text-sm mb-4">
              {zonaId || catId
                ? 'Ningún resultado con estos filtros.'
                : 'Sé el primero en reportar un problema.'}
            </p>
            {(zonaId || catId) && (
              <button
                onClick={() => cambiarFiltro(() => { setZonaId(''); setCatId(''); })}
                className="btn-ghost"
              >
                Ver todas
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {denuncias.map(d => (
              <DenunciaCard
                key={d.id}
                denuncia={d}
                session={session}
                onSelect={id => navigate(`/denuncia/${id}`)}
              />
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              disabled={pagina === 1}
              onClick={() => setPagina(p => p - 1)}
              className="btn-ghost disabled:opacity-40"
            >
              ← Anterior
            </button>
            <span className="font-mono text-sm text-ink-faint flex items-center px-2">
              {pagina} / {totalPaginas}
            </span>
            <button
              disabled={pagina === totalPaginas}
              onClick={() => setPagina(p => p + 1)}
              className="btn-ghost disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
