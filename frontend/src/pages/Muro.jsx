import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import DenunciaCard from '../components/ui/DenunciaCard';

const ORDEN_OPTS = [
  { value: 'reciente', label: 'Más reciente' },
  { value: 'apoyos',   label: 'Más apoyado' },
  { value: 'gravedad', label: 'Más grave' },
];

export default function Muro({ session }) {
  const [denuncias, setDenuncias] = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [orden, setOrden]         = useState('reciente');
  const [pagina, setPagina]       = useState(1);
  const [total, setTotal]         = useState(0);
  const navigate = useNavigate();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.denuncias.list({ orden, pagina });
      setDenuncias(res.data);
      setTotal(res.total);
    } catch {
      // mantener datos anteriores en caso de error transitorio
    } finally {
      setCargando(false);
    }
  }, [orden, pagina]);

  useEffect(() => { cargar(); }, [cargar]);

  async function cerrarSesion() {
    await supabase.auth.signOut();
  }

  const totalPaginas = Math.ceil(total / 20);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-ink text-white">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl tracking-wide">
              <span className="text-brand-yellow">PORTO</span>SINFILTRO
            </h1>
            <p className="text-xs text-gray-400 font-mono">El Muro de la Vergüenza</p>
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <>
                <button
                  onClick={() => navigate('/nueva')}
                  className="bg-brand-yellow text-ink text-sm font-semibold px-4 py-1.5 rounded-card
                             hover:brightness-95 transition-all"
                >
                  + Denunciar
                </button>
                <button
                  onClick={cerrarSesion}
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Salir
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Ingresar
              </button>
            )}
          </div>
        </div>

        {/* Ticker */}
        <div className="border-t border-gray-700 bg-brand-red overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-1 text-white text-xs font-mono">
            <span className="font-bold uppercase tracking-widest shrink-0">EN VIVO</span>
            <span className="opacity-60 shrink-0">|</span>
            <span className="truncate">
              {total} denuncias activas en Portoviejo · Reporta un problema en tu barrio
            </span>
          </div>
        </div>
      </header>

      {/* Filtros */}
      <div className="border-b border-surface-muted bg-surface-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-2">
          <span className="text-xs text-ink-faint font-mono mr-1">ORDENAR:</span>
          {ORDEN_OPTS.map(o => (
            <button
              key={o.value}
              onClick={() => { setOrden(o.value); setPagina(1); }}
              className={`chip cursor-pointer transition-colors ${orden === o.value ? 'chip-active' : 'hover:bg-surface-muted'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de denuncias */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {cargando ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card h-40 animate-pulse bg-surface-muted" />
            ))}
          </div>
        ) : denuncias.length === 0 ? (
          <div className="text-center py-20 text-ink-faint">
            <p className="font-headline text-2xl mb-2">Sin denuncias</p>
            <p className="text-sm">Sé el primero en reportar un problema</p>
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
      </main>

      <footer className="border-t border-surface-muted py-4 text-center text-xs text-ink-faint font-mono">
        PortoSinFiltro · Portoviejo, Manabí · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
