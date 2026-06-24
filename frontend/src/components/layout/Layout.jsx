import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function Layout({ session, perfil, children, back }) {
  const navigate = useNavigate();

  async function cerrarSesion() {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      <header className="bg-ink text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {back && (
              <>
                <button
                  onClick={() => navigate(-1)}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  ← Volver
                </button>
                <span className="text-gray-600">|</span>
              </>
            )}
            <Link to="/" className="font-headline text-xl tracking-wide">
              <span className="text-brand-yellow">PORTO</span>SINFILTRO
            </Link>
          </div>

          <nav className="flex items-center gap-3">
            {session ? (
              <>
                {perfil?.rol === 'administrador' && (
                  <Link
                    to="/admin"
                    className="text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    Admin
                  </Link>
                )}
                {perfil?.rol === 'ciudadano' && (
                  <Link
                    to="/panel-publico"
                    className="text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    Panel público
                  </Link>
                )}
                {perfil?.rol === 'ciudadano' && (
                  <Link
                    to="/mis-denuncias"
                    className="text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    Mis denuncias
                  </Link>
                )}
                {perfil?.rol === 'ciudadano' && (
                  <Link
                    to="/nueva"
                    className="bg-brand-yellow text-ink text-sm font-semibold px-4 py-1.5 rounded-card
                               hover:brightness-95 transition-all"
                  >
                    + Denunciar
                  </Link>
                )}
                <button
                  onClick={cerrarSesion}
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/panel-publico"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Panel público
                </Link>
                <Link
                  to="/login"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Ingresar
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Ticker — solo en el muro (cuando no hay back) */}
        {!back && (
          <div className="border-t border-gray-700 bg-brand-red overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-1 text-white text-xs font-mono">
              <span className="font-bold uppercase tracking-widest shrink-0 ticker-live animate-pulse">
                EN VIVO
              </span>
              <span className="opacity-60 shrink-0">|</span>
              <span className="truncate">
                Portoviejo, Manabí — reporta un problema en tu barrio
              </span>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-surface-muted py-4 text-center text-xs text-ink-faint font-mono">
        PortoSinFiltro · Portoviejo, Manabí · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
