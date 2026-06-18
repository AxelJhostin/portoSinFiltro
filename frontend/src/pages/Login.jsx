import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setCargando(true);
    setError('');

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

    setCargando(false);
    if (err) return setError(err.message);
    setEnviado(true);
  }

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
      <div className="card w-full max-w-sm p-8">
        <h1 className="font-headline text-3xl mb-1">PortoSinFiltro</h1>
        <p className="text-ink-soft text-sm mb-6">Accede para denunciar o gestionar problemas</p>

        {enviado ? (
          <div className="bg-green-50 border border-green-200 rounded-card p-4 text-sm text-brand-green">
            Revisa tu correo — te enviamos un enlace para ingresar.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-ink-soft uppercase tracking-wide">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@correo.com"
                className="w-full border border-surface-muted rounded-card px-3 py-2 text-sm
                           focus:outline-none focus:border-ink transition-colors"
              />
            </div>

            {error && (
              <p className="text-brand-red text-xs">{error}</p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="btn-primary w-full justify-center disabled:opacity-50"
            >
              {cargando ? 'Enviando…' : 'Ingresar con enlace mágico'}
            </button>
          </form>
        )}

        <p className="mt-6 text-xs text-ink-faint text-center">
          Solo necesitas tu correo — sin contraseñas.
        </p>
      </div>
    </div>
  );
}
