import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const ESTADO_LABEL = {
  pendiente:  'PENDIENTE',
  en_proceso: 'EN PROCESO',
  resuelto:   'RESUELTO',
};

const ESTADO_COLOR = {
  pendiente:  'estado-pendiente',
  en_proceso: 'estado-en_proceso',
  resuelto:   'estado-resuelto',
};

const GRAVEDAD_LABEL = {
  1: 'Baja',
  2: 'Moderada',
  3: 'Media',
  4: 'Alta',
  5: 'Crítica',
};

const TIPO_LABEL = {
  confirmacion: 'Confirma el problema',
  evidencia:    'Agrega evidencia',
  detalle:      'Agrega detalle',
  relacionado:  'Problema relacionado',
};

export default function DetalleDenuncia({ session }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [denuncia, setDenuncia]   = useState(null);
  const [aportes, setAportes]     = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [apoyado, setApoyado]     = useState(false);
  const [apoyos, setApoyos]       = useState(0);
  const [enviando, setEnviando]   = useState(false);

  // Estado del formulario de aporte
  const [form, setForm] = useState({
    tipo: 'confirmacion',
    contenido: '',
    anonimo: false,
  });
  const [formError, setFormError] = useState('');
  const [formOk, setFormOk]       = useState(false);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      try {
        const [d, a] = await Promise.all([
          api.denuncias.get(id),
          api.aportes.list(id),
        ]);
        setDenuncia(d);
        setApoyos(d.total_apoyos);
        setAportes(a);
      } catch {
        navigate('/', { replace: true });
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [id, navigate]);

  async function toggleApoyo() {
    if (!session) return navigate('/login');
    try {
      const { apoyo } = await api.denuncias.apoyo(id);
      setApoyado(apoyo);
      setApoyos(n => apoyo ? n + 1 : n - 1);
    } catch {/* silencioso */}
  }

  async function enviarAporte(e) {
    e.preventDefault();
    if (!session) return navigate('/login');
    if (form.contenido.trim().length < 5) {
      return setFormError('Escribe al menos 5 caracteres.');
    }
    setEnviando(true);
    setFormError('');
    try {
      const nuevo = await api.aportes.create(id, form);
      setAportes(prev => [...prev, nuevo]);
      setForm({ tipo: 'confirmacion', contenido: '', anonimo: false });
      setFormOk(true);
      setTimeout(() => setFormOk(false), 3000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-faint font-mono text-sm">
        Cargando denuncia…
      </div>
    );
  }

  if (!denuncia) return null;

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      {/* Header */}
      <header className="bg-ink text-white">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Volver
          </button>
          <span className="text-gray-600">|</span>
          <h1 className="font-headline text-xl tracking-wide">
            <span className="text-brand-yellow">PORTO</span>SINFILTRO
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">

        {/* Tarjeta principal */}
        <article className="card p-6">
          {/* Zona + estado */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs text-ink-faint uppercase tracking-wide">
              {denuncia.zona} · {denuncia.categoria}
            </span>
            <span className={`chip text-xs px-2 py-0.5 rounded-full ${ESTADO_COLOR[denuncia.estado]}`}>
              {ESTADO_LABEL[denuncia.estado]}
            </span>
          </div>

          {/* Titular */}
          <h2 className="font-headline text-2xl leading-tight mb-4">
            {denuncia.titular}
          </h2>

          {/* Descripción completa */}
          <p className="text-ink leading-relaxed mb-4">
            {denuncia.descripcion}
          </p>

          {/* Metadatos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-center">
            <div className="bg-surface-base rounded-card p-3">
              <p className="font-headline text-2xl">{denuncia.dias_sin_resolver}</p>
              <p className="text-xs text-ink-faint">días sin solución</p>
            </div>
            <div className="bg-surface-base rounded-card p-3">
              <p className="font-headline text-2xl">{apoyos}</p>
              <p className="text-xs text-ink-faint">apoyos</p>
            </div>
            <div className="bg-surface-base rounded-card p-3">
              <p className="font-headline text-2xl">{denuncia.total_aportes}</p>
              <p className="text-xs text-ink-faint">aportes</p>
            </div>
            <div className="bg-surface-base rounded-card p-3">
              <p className="font-headline text-2xl text-brand-red">
                {GRAVEDAD_LABEL[denuncia.gravedad]}
              </p>
              <p className="text-xs text-ink-faint">gravedad</p>
            </div>
          </div>

          {/* Barra de gravedad */}
          <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-brand-red rounded-full"
              style={{ width: `${(denuncia.gravedad / 5) * 100}%` }}
            />
          </div>

          {/* Autor y fecha */}
          <div className="flex items-center justify-between text-xs text-ink-faint font-mono">
            <span>
              {denuncia.anonima ? 'Ciudadano Anónimo' : denuncia.autor_nombre}
            </span>
            <span>{new Date(denuncia.created_at).toLocaleDateString('es-EC', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}</span>
          </div>

          {/* Botón de apoyo */}
          <div className="mt-4 pt-4 border-t border-surface-muted">
            <button
              onClick={toggleApoyo}
              className={`w-full py-2 rounded-card font-semibold text-sm transition-all
                ${apoyado
                  ? 'bg-brand-red text-white'
                  : 'bg-surface-base border border-surface-muted text-ink hover:bg-ink hover:text-white'
                }`}
            >
              {apoyado ? '▲ Apoyaste esta denuncia' : '△ Apoyar esta denuncia'}
              {!session && <span className="text-xs font-normal ml-1">(inicia sesión)</span>}
            </button>
          </div>
        </article>

        {/* Aportes / Confirmaciones */}
        <section>
          <h3 className="font-headline text-lg mb-3">
            Aportes ciudadanos
            <span className="font-body text-sm text-ink-faint ml-2 font-normal">
              ({aportes.length})
            </span>
          </h3>

          {aportes.length === 0 ? (
            <div className="card p-6 text-center text-ink-faint text-sm">
              Nadie ha aportado aún — sé el primero en confirmar o agregar evidencia.
            </div>
          ) : (
            <div className="space-y-3">
              {aportes.map(a => (
                <div key={a.id} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-brand-amber uppercase tracking-wide">
                      {TIPO_LABEL[a.tipo] || a.tipo}
                    </span>
                    <span className="text-xs text-ink-faint font-mono">
                      {a.autor} {a.rol ? `· ${a.rol}` : ''}
                    </span>
                  </div>
                  {a.contenido && (
                    <p className="text-sm text-ink leading-relaxed">{a.contenido}</p>
                  )}
                  <p className="text-xs text-ink-faint mt-2 font-mono">
                    {new Date(a.created_at).toLocaleDateString('es-EC', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Formulario para agregar aporte */}
        <section className="card p-5">
          <h3 className="font-headline text-lg mb-4">¿Conoces este problema?</h3>

          {!session ? (
            <div className="text-center py-4">
              <p className="text-sm text-ink-soft mb-3">
                Inicia sesión para confirmar, agregar evidencia o detalles.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary"
              >
                Ingresar
              </button>
            </div>
          ) : (
            <form onSubmit={enviarAporte} className="space-y-4">
              {/* Tipo */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-ink-soft uppercase tracking-wide">
                  Tipo de aporte
                </label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full border border-surface-muted rounded-card px-3 py-2 text-sm
                             focus:outline-none focus:border-ink bg-white"
                >
                  <option value="confirmacion">Confirmo que existe este problema</option>
                  <option value="evidencia">Tengo evidencia (foto / descripción)</option>
                  <option value="detalle">Agrego un detalle importante</option>
                  <option value="relacionado">Es un problema relacionado</option>
                </select>
              </div>

              {/* Contenido */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-ink-soft uppercase tracking-wide">
                  Descripción
                </label>
                <textarea
                  value={form.contenido}
                  onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
                  rows={3}
                  maxLength={500}
                  placeholder="Describe lo que sabes sobre este problema…"
                  className="w-full border border-surface-muted rounded-card px-3 py-2 text-sm
                             focus:outline-none focus:border-ink resize-none"
                />
                <p className="text-xs text-ink-faint text-right mt-0.5">
                  {form.contenido.length}/500
                </p>
              </div>

              {/* Anónimo */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.anonimo}
                  onChange={e => setForm(f => ({ ...f, anonimo: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-ink-soft">Publicar de forma anónima</span>
              </label>

              {formError && (
                <p className="text-brand-red text-xs">{formError}</p>
              )}
              {formOk && (
                <p className="text-brand-green text-xs font-semibold">
                  ✓ Aporte enviado correctamente.
                </p>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="btn-primary disabled:opacity-50"
              >
                {enviando ? 'Enviando…' : 'Enviar aporte'}
              </button>
            </form>
          )}
        </section>
      </main>

      <footer className="border-t border-surface-muted py-4 text-center text-xs text-ink-faint font-mono mt-6">
        PortoSinFiltro · Portoviejo, Manabí · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
