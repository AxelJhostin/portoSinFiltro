import { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import MapaDenuncias from '../components/ui/MapaDenuncias';
import { api } from '../lib/api';
import { ESTADO_LABEL } from '../lib/constants';

const FILTROS = [
  { val: '',           label: 'Todas' },
  { val: 'activa',     label: ESTADO_LABEL.activa },
  { val: 'con_avance', label: ESTADO_LABEL.con_avance },
  { val: 'resuelta',   label: ESTADO_LABEL.resuelta },
];

export default function Mapa({ session, perfil }) {
  const [denuncias, setDenuncias] = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState('');
  const [filtroEstado, setFiltro] = useState('');

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      setError('');
      try {
        const params = filtroEstado ? { estado: filtroEstado } : {};
        const data = await api.denuncias.mapa(params);
        setDenuncias(data);
      } catch (err) {
        setError(err.message || 'No se pudo cargar el mapa.');
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [filtroEstado]);

  return (
    <Layout session={session} perfil={perfil} back>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl text-ink text-balance">Mapa de denuncias</h1>
          <p className="text-sm text-ink-soft mt-1.5 max-w-2xl text-pretty">
            Todas las denuncias con ubicación registrada, agrupadas en el mapa de Portoviejo.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {FILTROS.map(f => (
            <button
              key={f.val || 'todas'}
              type="button"
              aria-pressed={filtroEstado === f.val}
              onClick={() => setFiltro(f.val)}
              className={`chip cursor-pointer transition-colors
                ${filtroEstado === f.val ? 'chip-active' : 'hover:bg-surface-muted'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-ink" role="alert">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="w-full h-[28rem] rounded-card bg-surface-muted animate-pulse" />
        ) : denuncias.length === 0 ? (
          <div className="card p-8 text-center text-ink-soft text-sm">
            No hay denuncias con ubicación registrada en este filtro.
          </div>
        ) : (
          <>
            <MapaDenuncias denuncias={denuncias} />
            <p className="text-xs text-ink-faint text-center">
              {denuncias.length} denuncia{denuncias.length !== 1 ? 's' : ''} con ubicación en el mapa.
            </p>
          </>
        )}
      </div>
    </Layout>
  );
}
