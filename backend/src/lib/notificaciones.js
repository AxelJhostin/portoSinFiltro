import { supabase } from '../db/supabase.js';

const ESTADO_LABEL = { activa: 'ACTIVA', con_avance: 'CON AVANCE', resuelta: 'RESUELTA' };

export async function obtenerEstadoDenuncia(denunciaId) {
  const { data, error } = await supabase.from('vista_denuncias').select('estado').eq('id', denunciaId).single();
  return error ? null : data.estado;
}

// El fallo de correo nunca debe bloquear un aporte o una valoración ciudadana.
export async function notificarCambioEstado(denunciaId, estadoAnterior) {
  if (process.env.NOTIFICATIONS_ENABLED !== 'true' || !estadoAnterior) return;
  const estadoActual = await obtenerEstadoDenuncia(denunciaId);
  if (!estadoActual || estadoActual === estadoAnterior) return;

  const { data: denuncia, error: denunciaError } = await supabase
    .from('denuncias').select('autor_id, titular').eq('id', denunciaId).single();
  if (denunciaError || !denuncia?.autor_id) return console.error('[notificaciones] Autor no encontrado.', denunciaError?.message);

  const { data: authData, error: authError } = await supabase.auth.admin.getUserById(denuncia.autor_id);
  const destinatario = authData?.user?.email;
  if (authError || !destinatario) return console.error('[notificaciones] Destinatario no disponible.', authError?.message);

  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/notify-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}` },
      body: JSON.stringify({ to: destinatario, titulo: denuncia.titular, estado: estadoActual, estadoLabel: ESTADO_LABEL[estadoActual] ?? estadoActual }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) console.error('[notificaciones] Edge Function respondió con', response.status);
  } catch (error) {
    console.error('[notificaciones] No se pudo invocar la Edge Function.', error.message);
  }
}
