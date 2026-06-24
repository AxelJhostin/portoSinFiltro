import { supabase } from './supabase';

const BASE = '/api';

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json', ...(await authHeaders()) };
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error del servidor');
  return json;
}

// Subida multipart (no usa Content-Type JSON; el navegador pone el boundary)
async function upload(path, file, campo = 'foto') {
  const form = new FormData();
  form.append(campo, file);
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { ...(await authHeaders()) },
    body: form,
  });
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Error al subir la foto (HTTP ${res.status}).`);
  }
  if (!res.ok) throw new Error(json.error || 'Error al subir la foto');
  return json;
}

export const api = {
  denuncias: {
    list:   (params = {}) => req('GET', `/denuncias?${new URLSearchParams(params)}`),
    get:    (id)          => req('GET', `/denuncias/${id}`),
    create: (body)        => req('POST', '/denuncias', body),
    ocultar: (id, body)   => req('PATCH', `/denuncias/${id}/ocultar`, body),
    reporte: (id, body)   => req('POST', `/denuncias/${id}/reporte`, body),
    apoyo:  (id)          => req('POST', `/denuncias/${id}/apoyo`),
    progreso: (id, progresando) => req('POST', `/denuncias/${id}/progreso`, { progresando }),
    fotos:  (id)          => req('GET', `/denuncias/${id}/fotos`),
    subirFoto: (id, file) => upload(`/denuncias/${id}/foto`, file),
  },
  aportes: {
    list:   (id)          => req('GET', `/denuncias/${id}/aportes`),
    create: (id, body)    => req('POST', `/denuncias/${id}/aportes`, body),
  },
  dashboard: {
    get:    () => req('GET', '/dashboard'),
    public: () => req('GET', '/dashboard/public'),
  },
  admin: {
    denuncias: (params = {}) => req('GET', `/admin/denuncias?${new URLSearchParams(params)}`),
    reportes:  (params = {}) => req('GET', `/admin/reportes?${new URLSearchParams(params)}`),
  },
};
