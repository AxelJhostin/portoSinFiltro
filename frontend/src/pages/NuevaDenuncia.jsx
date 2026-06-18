import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Layout from '../components/layout/Layout';
import { CATEGORIAS, ZONAS, GRAVEDAD_LABEL } from '../lib/constants';

const GRAVEDAD_LABELS = ['', ...Object.values(GRAVEDAD_LABEL)];

export default function NuevaDenuncia({ session, perfil }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) navigate('/login', { replace: true });
  }, [session, navigate]);

  const [form, setForm] = useState({
    categoria_id: '',
    zona_id: '',
    descripcion: '',
    gravedad: 3,
    anonima: false,
  });
  const [foto, setFoto]         = useState(null);
  const [error, setError]       = useState('');
  const [enviando, setEnviando] = useState(false);

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }));
  }

  function validar() {
    if (!form.categoria_id) return 'Selecciona una categoría.';
    if (!form.zona_id)      return 'Selecciona una zona.';
    if (form.descripcion.trim().length < 20)
      return 'La descripción debe tener al menos 20 caracteres.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validar();
    if (err) return setError(err);
    setEnviando(true);
    setError('');
    try {
      const nueva = await api.denuncias.create({
        categoria_id: Number(form.categoria_id),
        zona_id:      Number(form.zona_id),
        descripcion:  form.descripcion.trim(),
        gravedad:     Number(form.gravedad),
        anonima:      form.anonima,
      });
      navigate(`/denuncia/${nueva.id}`);
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  if (!session) return null;

  const descOk = form.descripcion.length >= 20;

  return (
    <Layout session={session} perfil={perfil} back>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="card p-6">
          <h2 className="font-headline text-2xl mb-1">Nueva denuncia</h2>
          <p className="text-sm text-ink-soft mb-6">
            Reporta un problema en tu barrio. El municipio lo verá publicado en el Muro.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Categoría */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-ink-soft uppercase tracking-wide">
                Categoría *
              </label>
              <select
                value={form.categoria_id}
                onChange={e => set('categoria_id', e.target.value)}
                className="w-full border border-surface-muted rounded-card px-3 py-2 text-sm
                           focus:outline-none focus:border-ink bg-white"
              >
                <option value="">— Selecciona una categoría —</option>
                {CATEGORIAS.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            {/* Zona */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-ink-soft uppercase tracking-wide">
                Zona / Barrio *
              </label>
              <select
                value={form.zona_id}
                onChange={e => set('zona_id', e.target.value)}
                className="w-full border border-surface-muted rounded-card px-3 py-2 text-sm
                           focus:outline-none focus:border-ink bg-white"
              >
                <option value="">— Selecciona una zona —</option>
                {ZONAS.map(z => (
                  <option key={z.id} value={z.id}>{z.nombre}</option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-ink-soft uppercase tracking-wide">
                Descripción del problema *
              </label>
              <textarea
                value={form.descripcion}
                onChange={e => set('descripcion', e.target.value)}
                rows={5}
                maxLength={1000}
                placeholder="Describe el problema con el mayor detalle posible: ubicación exacta, tiempo que lleva sin solución, consecuencias que está causando…"
                className="w-full border border-surface-muted rounded-card px-3 py-2 text-sm
                           focus:outline-none focus:border-ink resize-none"
              />
              <div className="flex justify-between text-xs mt-0.5">
                <span className={descOk ? 'text-brand-green' : 'text-ink-faint'}>
                  {descOk ? '✓ Suficiente' : `Mínimo 20 caracteres (faltan ${20 - form.descripcion.length})`}
                </span>
                <span className="text-ink-faint">{form.descripcion.length}/1000</span>
              </div>
            </div>

            {/* Foto (UI lista, sin conexión al backend aún) */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-ink-soft uppercase tracking-wide">
                Foto del problema <span className="font-normal normal-case">(opcional)</span>
              </label>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed
                                border-surface-muted rounded-card cursor-pointer hover:border-ink transition-colors
                                bg-surface-base">
                {foto ? (
                  <div className="flex items-center gap-2 text-sm text-ink">
                    <span>📎</span>
                    <span className="truncate max-w-xs">{foto.name}</span>
                    <button
                      type="button"
                      onClick={e => { e.preventDefault(); setFoto(null); }}
                      className="text-brand-red hover:underline text-xs"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-ink-faint text-2xl mb-1">+</span>
                    <span className="text-xs text-ink-faint">Haz clic para adjuntar una foto</span>
                    <span className="text-xs text-ink-faint opacity-60">JPG, PNG — máx. 5 MB</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => setFoto(e.target.files[0] ?? null)}
                />
              </label>
              {foto && (
                <p className="text-xs text-brand-amber mt-1">
                  ⚠ La subida de fotos se habilitará próximamente.
                </p>
              )}
            </div>

            {/* Gravedad */}
            <div>
              <label className="block text-xs font-semibold mb-2 text-ink-soft uppercase tracking-wide">
                Gravedad: <span className="text-brand-red">{GRAVEDAD_LABELS[form.gravedad]}</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => set('gravedad', n)}
                    className={`flex-1 py-2 rounded-card text-sm font-semibold border transition-all
                      ${form.gravedad === n
                        ? 'bg-brand-red text-white border-brand-red'
                        : 'border-surface-muted text-ink-soft hover:border-ink hover:text-ink'
                      }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-ink-faint mt-1 px-0.5">
                <span>Baja</span><span>Crítica</span>
              </div>
            </div>

            {/* Anónima */}
            <div className="bg-surface-base rounded-card p-4">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.anonima}
                  onChange={e => set('anonima', e.target.checked)}
                  className="mt-0.5 rounded"
                />
                <div>
                  <p className="text-sm font-semibold text-ink">Publicar de forma anónima</p>
                  <p className="text-xs text-ink-faint mt-0.5">
                    Tu nombre no aparecerá en el muro público. El municipio puede
                    identificarte internamente en caso de abuso.
                  </p>
                </div>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-card px-4 py-3 text-sm text-brand-red">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50"
            >
              {enviando ? 'Publicando denuncia…' : 'Publicar denuncia'}
            </button>

            <p className="text-xs text-ink-faint text-center">
              Al publicar aceptas que el contenido es veraz y no calumnioso.
            </p>
          </form>
        </div>
      </div>
    </Layout>
  );
}
