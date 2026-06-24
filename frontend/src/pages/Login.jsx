import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [modo, setModo] = useState('login'); // 'login' | 'registro'
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [cargando, setCargando] = useState(false);

  const esRegistro = modo === 'registro';

  function cambiarModo() {
    setModo(esRegistro ? 'login' : 'registro');
    setError('');
    setInfo('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setCargando(true);
    setError('');
    setInfo('');

    if (esRegistro) {
      // Registro de ciudadano. El rol 'ciudadano' lo asigna automáticamente
      // el trigger handle_new_user en la base de datos (ver database/schema.sql).
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre } },
      });
      setCargando(false);
      if (err) return setError(err.message);

      if (data.session) {
        navigate('/', { replace: true });
      } else {
        // Si la confirmación de correo está activa, no hay sesión todavía.
        setInfo('Cuenta creada. Revisa tu correo para confirmarla antes de ingresar.');
        setModo('login');
      }
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);
    if (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos.'
          : err.message
      );
      return;
    }
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
      <div className="card w-full max-w-sm p-8">
        <h1 className="font-headline text-3xl mb-1">PortoSinFiltro</h1>
        <p className="text-ink-soft text-sm mb-6">
          {esRegistro
            ? 'Crea tu cuenta de ciudadano para denunciar'
            : 'Accede para denunciar o gestionar problemas'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {esRegistro && (
            <div>
              <label className="block text-xs font-semibold mb-1 text-ink-soft uppercase tracking-wide">
                Nombre
              </label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
                placeholder="Tu nombre"
                className="w-full border border-surface-muted rounded-card px-3 py-2 text-sm
                           focus:outline-none focus:border-ink transition-colors"
              />
            </div>
          )}

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

          <div>
            <label className="block text-xs font-semibold mb-1 text-ink-soft uppercase tracking-wide">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full border border-surface-muted rounded-card px-3 py-2 text-sm
                         focus:outline-none focus:border-ink transition-colors"
            />
            {esRegistro && (
              <p className="text-xs text-ink-faint mt-1">Mínimo 6 caracteres.</p>
            )}
          </div>

          {error && <p className="text-brand-red text-xs">{error}</p>}
          {info && <p className="text-brand-green text-xs font-semibold">{info}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="btn-primary w-full justify-center disabled:opacity-50"
          >
            {cargando
              ? (esRegistro ? 'Creando cuenta…' : 'Ingresando…')
              : (esRegistro ? 'Crear cuenta' : 'Ingresar')}
          </button>
        </form>

        <p className="mt-6 text-xs text-ink-faint text-center">
          {esRegistro ? '¿Ya tienes cuenta?' : '¿Eres ciudadano y no tienes cuenta?'}{' '}
          <button
            type="button"
            onClick={cambiarModo}
            className="text-brand-red font-semibold hover:underline"
          >
            {esRegistro ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </div>
    </div>
  );
}
