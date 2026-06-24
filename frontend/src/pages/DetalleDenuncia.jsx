import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import Layout from '../components/layout/Layout';
import MapaUbicacion from '../components/ui/MapaUbicacion';
import BarraGravedad from '../components/ui/BarraGravedad';
import { ESTADO_LABEL, ESTADO_COLOR, GRAVEDAD_LABEL, TIPO_APORTE_LABEL } from '../lib/constants';

export default function DetalleDenuncia({ session, perfil }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const avisoFoto = searchParams.get('foto') === 'error';

  const [denuncia, setDenuncia] = useState(null);
  const [aportes, setAportes]   = useState([]);
  const [fotos, setFotos]       = useState([]);
  const [cargando, setCargando] = useState(true);
  const [apoyado, setApoyado]   = useState(false);
  const [apoyos, setApoyos]     = useState(0);
  const [miProgreso, setMiProgreso] = useState(null);
  const [progresoSi, setProgresoSi] = useState(0);
  const [progresoNo, setProgresoNo] = useState(0);
  const [marcandoProgreso, setMarcandoProgreso] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [form, setForm]         = useState({ tipo: 'confirmacion', contenido: '', anonimo: false });
  const [formError, setFormError] = useState('');
  const [formOk, setFormOk]     = useState(false);
  const [yaReporto, setYaReporto] = useState(false);
  const [totalReportes, setTotalReportes] = useState(0);
  const [motivoReporte, setMotivoReporte] = useState('');
  const [enviandoReporte, setEnviandoReporte] = useState(false);
  const [reporteError, setReporteError] = useState('');
  const [reporteOk, setReporteOk] = useState(false);

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
        setMiProgreso(d.mi_progreso ?? null);
        setProgresoSi(d.total_progreso_si ?? 0);
        setProgresoNo(d.total_progreso_no ?? 0);
        setYaReporto(d.ya_reporto ?? false);
        setTotalReportes(d.total_reportes ?? 0);
        setAportes(a);
        try {
          const f = await api.denuncias.fotos(id);
          setFotos(f);
        } catch {
          setFotos([]);
        }
      } catch {
        navigate('/', { replace: true });
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [id, navigate]);

  async function marcarProgreso(progresando) {
    if (!session) return navigate('/login');
    if (perfil?.rol !== 'ciudadano') return;
    setMarcandoProgreso(true);
    try {
      const res = await api.denuncias.progreso(id, progresando);
      setMiProgreso(res.mi_progreso);
      setProgresoSi(res.total_progreso_si);
      setProgresoNo(res.total_progreso_no);
    } catch {/* silencioso */}
    finally { setMarcandoProgreso(false); }
  }

  async function toggleApoyo() {
    if (!session) return navigate('/login');
    try {
      const { apoyo } = await api.denuncias.apoyo(id);
      setApoyado(apoyo);
      setApoyos(n => apoyo ? n + 1 : n - 1);
    } catch {/* silencioso */}
  }

  async function enviarReporte(e) {
    e.preventDefault();
    if (!session) return navigate('/login');
    if (motivoReporte.trim().length < 10) {
      return setReporteError('Describe el motivo con al menos 10 caracteres.');
    }
    setEnviandoReporte(true);
    setReporteError('');
    try {
      const res = await api.denuncias.reporte(id, { motivo: motivoReporte.trim() });
      setYaReporto(true);
      setTotalReportes(res.total_reportes ?? totalReportes + 1);
      setMotivoReporte('');
      setReporteOk(true);
      setTimeout(() => setReporteOk(false), 3000);
    } catch (err) {
      setReporteError(err.message);
    } finally {
      setEnviandoReporte(false);
    }
  }

  async function enviarAporte(e) {
    e.preventDefault();
    if (!session) return navigate('/login');
    if (form.contenido.trim().length < 5) return setFormError('Escribe al menos 5 caracteres.');
    setEnviando(true);
    setFormError('');
    try {
      const nuevo = await api.aportes.create(id, form);
      // El backend devuelve el aporte crudo (sin nombre de autor); lo enriquecemos
      // localmente para mostrarlo igual que los aportes cargados desde el GET.
      const enriquecido = {
        ...nuevo,
        autor: form.anonimo ? 'Ciudadano Anónimo' : (perfil?.nombre ?? 'Tú'),
        rol: form.anonimo ? null : perfil?.rol,
      };
      setAportes(prev => [...prev, enriquecido]);
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
      <Layout session={session} perfil={perfil} back>
        <div className="flex items-center justify-center py-32 text-ink-faint font-mono text-sm">
          Cargando denuncia…
        </div>
      </Layout>
    );
  }

  if (!denuncia) return null;

  return (
    <Layout session={session} perfil={perfil} back>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {avisoFoto && (
          <div className="bg-amber-50 border border-brand-amber rounded-card px-4 py-3 text-sm text-ink">
            La denuncia se publicó, pero <strong>la foto no se pudo subir</strong>.
            Usa una imagen en formato <strong>JPG, PNG o WEBP</strong> (no HEIC) de máximo 5 MB.
          </div>
        )}

        {/* Tarjeta principal */}
        <article className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs text-ink-faint uppercase tracking-wide">
              {denuncia.zona} · {denuncia.categoria}
            </span>
            <span className={`chip text-xs px-2 py-0.5 rounded-full ${ESTADO_COLOR[denuncia.estado]}`}>
              {ESTADO_LABEL[denuncia.estado]}
            </span>
          </div>

          <h2 className="font-headline text-2xl leading-tight mb-4">{denuncia.titular}</h2>
          <p className="text-ink leading-relaxed mb-4">{denuncia.descripcion}</p>

          {/* Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-center">
            {[
              { value: denuncia.dias_sin_resolver, label: 'días sin solución' },
              { value: apoyos,                    label: 'apoyos' },
              { value: denuncia.total_aportes,    label: 'aportes' },
              { value: GRAVEDAD_LABEL[denuncia.gravedad], label: 'gravedad', color: 'text-brand-red' },
            ].map(m => (
              <div key={m.label} className="bg-surface-base rounded-card p-3">
                <p className={`font-headline text-2xl ${m.color ?? ''}`}>{m.value}</p>
                <p className="text-xs text-ink-faint">{m.label}</p>
              </div>
            ))}
          </div>

          <BarraGravedad nivel={denuncia.gravedad} size="md" className="mb-4 max-w-xs" />

          <div className="flex items-center justify-between text-xs text-ink-faint font-mono">
            <span>{denuncia.anonima ? 'Ciudadano Anónimo' : denuncia.autor_nombre}</span>
            <span>{new Date(denuncia.created_at).toLocaleDateString('es-EC', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}</span>
          </div>

          <div className="mt-4 pt-4 border-t border-surface-muted space-y-4">
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

            <div className="bg-surface-base rounded-card p-4">
              <p className="text-sm font-semibold text-ink mb-1">¿Está progresando?</p>
              <p className="text-xs text-ink-soft mb-3">
                Opinión ciudadana sobre si el problema está mejorando en la calle.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4 text-center">
                <div className="rounded-card bg-surface-card border border-surface-muted p-3">
                  <p className="font-headline text-2xl text-brand-green tabular-nums">{progresoSi}</p>
                  <p className="text-xs text-ink-soft mt-0.5">ven progreso</p>
                </div>
                <div className="rounded-card bg-surface-card border border-surface-muted p-3">
                  <p className="font-headline text-2xl text-brand-red tabular-nums">{progresoNo}</p>
                  <p className="text-xs text-ink-soft mt-0.5">no ven progreso</p>
                </div>
              </div>

              {session && perfil?.rol === 'ciudadano' ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={marcandoProgreso}
                    onClick={() => marcarProgreso(true)}
                    aria-pressed={miProgreso === true}
                    className={`py-2 rounded-card text-sm font-semibold transition-all disabled:opacity-50
                      ${miProgreso === true
                        ? 'bg-brand-green text-white'
                        : 'border border-surface-muted text-ink-soft hover:border-brand-green hover:text-brand-green'
                      }`}
                  >
                    ✓ Sí progresa
                  </button>
                  <button
                    type="button"
                    disabled={marcandoProgreso}
                    onClick={() => marcarProgreso(false)}
                    aria-pressed={miProgreso === false}
                    className={`py-2 rounded-card text-sm font-semibold transition-all disabled:opacity-50
                      ${miProgreso === false
                        ? 'bg-brand-red text-white'
                        : 'border border-surface-muted text-ink-soft hover:border-brand-red hover:text-brand-red'
                      }`}
                  >
                    ✗ No progresa
                  </button>
                </div>
              ) : !session ? (
                <p className="text-xs text-ink-faint text-center">
                  <button type="button" onClick={() => navigate('/login')} className="text-brand-red font-semibold hover:underline">
                    Inicia sesión
                  </button>
                  {' '}como ciudadano para opinar.
                </p>
              ) : (
                <p className="text-xs text-ink-faint text-center">
                  Solo los ciudadanos pueden marcar el progreso.
                </p>
              )}
            </div>
          </div>
        </article>

        {/* Reportar falsa */}
        {session && perfil?.rol === 'ciudadano' && (
          <section className="card p-5 border-red-100">
            <h3 className="font-headline text-lg mb-2">¿Denuncia falsa o abusiva?</h3>
            <p className="text-xs text-ink-soft mb-3">
              Si crees que esta publicación no refleja un problema real, puedes reportarla.
              Un administrador revisará el caso.
              {totalReportes > 0 && (
                <span className="block mt-1 font-semibold text-brand-red">
                  {totalReportes} reporte{totalReportes !== 1 ? 's' : ''} de la comunidad
                </span>
              )}
            </p>

            {yaReporto ? (
              <p className="text-sm text-brand-green font-semibold">✓ Ya reportaste esta denuncia.</p>
            ) : (
              <form onSubmit={enviarReporte} className="space-y-3">
                <textarea
                  value={motivoReporte}
                  onChange={e => setMotivoReporte(e.target.value)}
                  rows={2}
                  maxLength={300}
                  placeholder="Explica por qué consideras que es falsa o abusiva…"
                  className="w-full border border-surface-muted rounded-card px-3 py-2 text-sm
                             focus:outline-none focus:border-ink resize-none"
                />
                {reporteError && <p className="text-brand-red text-xs">{reporteError}</p>}
                {reporteOk && (
                  <p className="text-brand-green text-xs font-semibold">✓ Reporte enviado.</p>
                )}
                <button
                  type="submit"
                  disabled={enviandoReporte}
                  className="btn-ghost text-brand-red border-red-200 disabled:opacity-50"
                >
                  {enviandoReporte ? 'Enviando…' : 'Reportar denuncia'}
                </button>
              </form>
            )}
          </section>
        )}

        {/* Fotos */}
        {fotos.length > 0 && (
          <section>
            <h3 className="font-headline text-lg mb-3">Fotos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {fotos.map(f => (
                <a
                  key={f.id}
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-card overflow-hidden border border-surface-muted bg-surface-card"
                >
                  <img
                    src={f.url}
                    alt="Foto de la denuncia"
                    loading="lazy"
                    className="w-full h-32 object-cover hover:opacity-90 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Ubicación */}
        {denuncia.latitud != null && denuncia.longitud != null && (
          <section>
            <h3 className="font-headline text-lg mb-3">Ubicación</h3>
            <MapaUbicacion lat={denuncia.latitud} lng={denuncia.longitud} alto="h-72" />
          </section>
        )}

        {/* Aportes */}
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
                      {TIPO_APORTE_LABEL[a.tipo] || a.tipo}
                    </span>
                    <span className="text-xs text-ink-faint font-mono">
                      {a.autor}{a.rol ? ` · ${a.rol}` : ''}
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

        {/* Formulario de aporte */}
        <section className="card p-5">
          <h3 className="font-headline text-lg mb-4">¿Conoces este problema?</h3>

          {!session ? (
            <div className="text-center py-4">
              <p className="text-sm text-ink-soft mb-3">
                Inicia sesión para confirmar, agregar evidencia o detalles.
              </p>
              <button onClick={() => navigate('/login')} className="btn-primary">
                Ingresar
              </button>
            </div>
          ) : (
            <form onSubmit={enviarAporte} className="space-y-4">
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
                  <option value="resolucion">Confirmo que ya se resolvió</option>
                </select>
              </div>

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
                <p className="text-xs text-ink-faint text-right mt-0.5">{form.contenido.length}/500</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.anonimo}
                  onChange={e => setForm(f => ({ ...f, anonimo: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-ink-soft">Publicar de forma anónima</span>
              </label>

              {formError && <p className="text-brand-red text-xs">{formError}</p>}
              {formOk && (
                <p className="text-brand-green text-xs font-semibold">
                  ✓ Aporte enviado correctamente.
                </p>
              )}

              <button type="submit" disabled={enviando} className="btn-primary disabled:opacity-50">
                {enviando ? 'Enviando…' : 'Enviar aporte'}
              </button>
            </form>
          )}
        </section>
      </div>
    </Layout>
  );
}
