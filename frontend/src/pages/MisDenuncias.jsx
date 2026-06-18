import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import Layout from '../components/layout/Layout';
import { ESTADO_LABEL, ESTADO_COLOR } from '../lib/constants';

export default function MisDenuncias({ session, perfil }) {
  const navigate = useNavigate();
  const [denuncias, setDenuncias] = useState([]);
  const [cargando, setCargando]   = useState(true);

  useEffect(() => {
    if (!session) { navigate('/login', { replace: true }); return; }

    // Filtramos por el UUID del usuario logueado — el backend lo valida contra el JWT
    api.denuncias.list({ autor_id: session.user.id, orden: 'reciente', pagina: 1 })
      .then(res => setDenuncias(res.data))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [session, navigate]);

  if (!session) return null;

  return (
    <Layout session={session} perfil={perfil} back>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h2 className="font-headline text-2xl mb-1">Mis denuncias</h2>
        <p className="text-sm text-ink-soft mb-6">
          Problemas que has reportado y su estado actual.
        </p>

        {cargando ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card h-20 animate-pulse bg-surface-muted" />
            ))}
          </div>
        ) : denuncias.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-ink-faint mb-4">Todavía no has publicado ninguna denuncia.</p>
            <Link to="/nueva" className="btn-primary">
              + Crear primera denuncia
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {denuncias.map(d => (
              <Link
                key={d.id}
                to={`/denuncia/${d.id}`}
                className="card p-4 flex items-start justify-between gap-4
                           hover:shadow-md transition-shadow group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`chip text-xs px-2 py-0.5 rounded-full ${ESTADO_COLOR[d.estado]}`}>
                      {ESTADO_LABEL[d.estado]}
                    </span>
                    <span className="text-xs text-ink-faint font-mono">
                      {d.zona} · {d.dias_sin_resolver}d
                    </span>
                  </div>
                  <p className="font-headline text-base group-hover:text-brand-red transition-colors line-clamp-1">
                    {d.titular}
                  </p>
                  <p className="text-xs text-ink-soft mt-1">
                    {d.total_apoyos} apoyo{d.total_apoyos !== 1 ? 's' : ''} ·{' '}
                    {d.total_aportes} aporte{d.total_aportes !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="text-ink-faint text-lg shrink-0">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
