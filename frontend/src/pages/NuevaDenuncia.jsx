import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Layout from '../components/layout/Layout';
import MapaUbicacion from '../components/ui/MapaUbicacion';
import { CATEGORIAS, ZONAS, GRAVEDAD_LABEL } from '../lib/constants';

const GRAVEDAD_LABELS = ['', ...Object.values(GRAVEDAD_LABEL)];

export default function NuevaDenuncia({ session, perfil }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true });
      return;
    }
    if (perfil && perfil.rol !== 'ciudadano') {
      navigate('/', { replace: true });
    }
  }, [session, perfil, navigate]);

  const [form, setForm] = useState({
    categoria_id: '',
    zona_id: '',
    descripcion: '',
    gravedad: 3,
    anonima: false,
  });
  const [ubicacion, setUbicacion] = useState({ lat: null, lng: null });
  const [foto, setFoto]         = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError]       = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!foto) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(foto);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  function usarMiUbicacion() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError('No se pudo obtener tu ubicación. Marca el punto en el mapa.'),
    );
  }

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }));
  }

  function validarFoto(archivo) {
    if (!archivo) return null;
    const ext = archivo.name.split('.').pop()?.toLowerCase() ?? '';
    if (['heic', 'heif'].includes(ext) || ['image/heic', 'image/heif'].includes(archivo.type)) {
      return 'Formato HEIC no soportado. Exporta la foto como JPG o PNG.';
    }
    const tiposOk = ['image/jpeg', 'image/png', 'image/webp'];
    const extOk = ['jpg', 'jpeg', 'png', 'webp'];
    const mimeOk = tiposOk.includes(archivo.type)
      || (['', 'application/octet-stream'].includes(archivo.type) && extOk.includes(ext));
    if (!mimeOk) {
      return 'Formato no soportado. Usa JPG, PNG o WEBP.';
    }
    if (archivo.size > 5 * 1024 * 1024) {
      return 'La foto supera 5 MB. Elige una imagen más pequeña.';
    }
    return null;
  }

  function validar() {
    if (!form.categoria_id) return 'Selecciona una categoría.';
    if (!form.zona_id)      return 'Selecciona una zona.';
    if (form.descripcion.trim().length < 20)
      return 'La descripción debe tener al menos 20 caracteres.';
    if (foto) {
      const errFoto = validarFoto(foto);
      if (errFoto) return errFoto;
    }
    return null;
  }

  function seleccionarFoto(archivo) {
    setError('');
    if (!archivo) { setFoto(null); return; }
    const err = validarFoto(archivo);
    if (err) { setError(err); setFoto(null); return; }
    setFoto(archivo);
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
        latitud:      ubicacion.lat,
        longitud:     ubicacion.lng,
      });

      if (foto) {
        try {
          await api.denuncias.subirFoto(nueva.id, foto);
        } catch (fotoErr) {
          navigate(`/denuncia/${nueva.id}?foto=error`, { replace: true });
          return;
        }
      }

      navigate(`/denuncia/${nueva.id}`);
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  if (!session || (perfil && perfil.rol !== 'ciudadano')) return null;

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

            {/* Ubicación en el mapa */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wide">
                  Ubicación <span className="font-normal normal-case">(opcional)</span>
                </label>
                <button
                  type="button"
                  onClick={usarMiUbicacion}
                  className="text-xs text-brand-red font-semibold hover:underline"
                >
                  Usar mi ubicación
                </button>
              </div>
              <p className="text-xs text-ink-faint mb-2">
                Haz clic en el mapa para marcar el punto exacto del problema.
              </p>
              <MapaUbicacion
                lat={ubicacion.lat}
                lng={ubicacion.lng}
                editable
                onSelect={(lat, lng) => setUbicacion({ lat, lng })}
              />
              {ubicacion.lat != null && (
                <div className="flex items-center justify-between text-xs text-ink-faint mt-1">
                  <span className="font-mono">
                    {ubicacion.lat.toFixed(5)}, {ubicacion.lng.toFixed(5)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setUbicacion({ lat: null, lng: null })}
                    className="text-brand-red hover:underline"
                  >
                    Quitar ubicación
                  </button>
                </div>
              )}
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

            {/* Foto */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-ink-soft uppercase tracking-wide">
                Foto del problema <span className="font-normal normal-case">(opcional)</span>
              </label>
              {foto ? (
                <div className="space-y-2">
                  <img
                    src={previewUrl}
                    alt="Vista previa"
                    className="w-full max-h-48 object-cover rounded-card border border-surface-muted"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-soft truncate">{foto.name}</span>
                    <button
                      type="button"
                      onClick={() => seleccionarFoto(null)}
                      className="text-brand-red hover:underline shrink-0 ml-2"
                    >
                      Quitar
                    </button>
                  </div>
                  <p className="text-xs text-brand-green">✓ Se subirá al publicar la denuncia.</p>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed
                                  border-surface-muted rounded-card cursor-pointer hover:border-ink transition-colors
                                  bg-surface-base">
                  <span className="text-ink-faint text-2xl mb-1">+</span>
                  <span className="text-xs text-ink-faint">Haz clic para adjuntar una foto</span>
                  <span className="text-xs text-ink-faint opacity-60">JPG, PNG o WEBP — máx. 5 MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={e => seleccionarFoto(e.target.files[0] ?? null)}
                  />
                </label>
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
