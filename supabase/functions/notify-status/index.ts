const jsonHeaders = { 'Content-Type': 'application/json' };
const estadosPermitidos = new Set(['activa', 'con_avance', 'resuelta']);

function respuesta(body: Record<string, string>, status: number) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function escaparHtml(texto: string) {
  return texto.replace(/[&<>"']/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[caracter]!));
}

async function enviarConReintento(apiKey: string, body: Record<string, unknown>) {
  let ultimaRespuesta: Response | undefined;
  for (let intento = 0; intento < 2; intento += 1) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (response.ok || (response.status < 500 && response.status !== 429)) return response;
    ultimaRespuesta = response;
    if (intento === 0) await new Promise(resolve => setTimeout(resolve, 500));
  }
  return ultimaRespuesta!;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return respuesta({ error: 'Método no permitido.' }, 405);
  let payload: { to?: string; titulo?: string; estado?: string; estadoLabel?: string };
  try { payload = await request.json(); } catch { return respuesta({ error: 'El cuerpo debe ser JSON válido.' }, 400); }
  if (!payload.to || !payload.to.includes('@') || !payload.titulo || !estadosPermitidos.has(payload.estado ?? '')) {
    return respuesta({ error: 'Datos de notificación inválidos.' }, 400);
  }
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const remitente = Deno.env.get('EMAIL_FROM');
  if (!apiKey || !remitente) return respuesta({ error: 'El proveedor de correo no está configurado.' }, 503);
  const estado = payload.estadoLabel ?? payload.estado;
  const titulo = escaparHtml(payload.titulo);
  const response = await enviarConReintento(apiKey, {
    from: remitente, to: [payload.to], subject: `Tu denuncia ahora está ${estado}`,
    html: `<h1>Actualización de tu denuncia</h1><p><strong>${titulo}</strong></p><p>Su estado comunitario ahora es <strong>${estado}</strong>.</p>`,
  });
  if (!response.ok) {
    console.error('[notify-status] Resend rechazó el envío:', await response.text());
    return respuesta({ error: 'No se pudo enviar el correo.' }, 502);
  }
  return respuesta({ ok: 'true' }, 200);
});
