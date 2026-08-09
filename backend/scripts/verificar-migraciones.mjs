#!/usr/bin/env node
/**
 * Verifica que las migraciones de database/*.sql estén aplicadas en el
 * proyecto Supabase real (SCRUM-65), y corre un par de pruebas negativas
 * de RLS. No modifica nada: el único INSERT es con la anon key y debe
 * fallar (si no falla, es justamente el hueco de seguridad que detecta).
 *
 * Uso: npm run verificar:db
 * Requiere backend/.env y frontend/.env con las claves reales de Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const backendDir = join(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: join(backendDir, '.env') });
config({ path: join(backendDir, '../frontend/.env') });

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const anon = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

let fallas = 0;

async function check(label, fn) {
  try {
    const r = await fn();
    console.log(`✅ ${label}` + (r ? ` — ${JSON.stringify(r)}` : ''));
  } catch (e) {
    fallas++;
    console.log(`❌ ${label} — ${e.message}`);
  }
}

console.log('=== migracion_ubicacion_fotos.sql ===');
await check('denuncias.latitud/longitud existen', async () => {
  const { error } = await admin.from('denuncias').select('latitud, longitud').limit(1);
  if (error) throw error;
});
await check('bucket "denuncias" existe', async () => {
  const { data, error } = await admin.storage.listBuckets();
  if (error) throw error;
  const b = data.find(x => x.id === 'denuncias');
  if (!b) throw new Error('bucket no encontrado');
  return { public: b.public };
});

console.log('\n=== migracion_foto_portada.sql ===');
await check('vista_denuncias.foto_portada existe', async () => {
  const { error } = await admin.from('vista_denuncias').select('foto_portada').limit(1);
  if (error) throw error;
});

console.log('\n=== migracion_progreso_ciudadano.sql ===');
await check('tabla valoraciones_progreso existe', async () => {
  const { error } = await admin.from('valoraciones_progreso').select('id').limit(1);
  if (error) throw error;
});
await check('vista_denuncias.total_progreso_si/no existen', async () => {
  const { error } = await admin.from('vista_denuncias').select('total_progreso_si, total_progreso_no').limit(1);
  if (error) throw error;
});

console.log('\n=== migracion_roles_comunitarios.sql ===');
await check('vista_denuncias.estado es computado (activa/con_avance/resuelta)', async () => {
  const { data, error } = await admin.from('vista_denuncias').select('estado').limit(50);
  if (error) throw error;
  const valores = [...new Set(data.map(d => d.estado))];
  const raros = valores.filter(v => !['activa', 'con_avance', 'resuelta'].includes(v));
  if (raros.length) throw new Error(`valores viejos encontrados: ${raros.join(', ')}`);
  return { valores_encontrados: valores };
});
await check('tabla reportes_denuncia existe', async () => {
  const { error } = await admin.from('reportes_denuncia').select('id').limit(1);
  if (error) throw error;
});
await check('vista_denuncias.total_reportes existe', async () => {
  const { error } = await admin.from('vista_denuncias').select('total_reportes').limit(1);
  if (error) throw error;
});
await check('perfiles.rol solo tiene ciudadano/administrador', async () => {
  const { data, error } = await admin.from('perfiles').select('rol');
  if (error) throw error;
  const roles = [...new Set(data.map(d => d.rol))];
  const raros = roles.filter(r => !['ciudadano', 'administrador'].includes(r));
  if (raros.length) throw new Error(`roles viejos encontrados: ${raros.join(', ')}`);
  return { roles_encontrados: roles };
});

console.log('\n=== migracion_resolucion_unica.sql ===');
await check('sin duplicados de resolucion por (denuncia, autor) — evidencia indirecta del indice unico', async () => {
  const { data, error } = await admin.from('aportes').select('denuncia_id, autor_id, tipo').eq('tipo', 'resolucion');
  if (error) throw error;
  const vistos = new Set();
  let duplicados = 0;
  for (const a of data) {
    if (!a.autor_id) continue;
    const key = `${a.denuncia_id}:${a.autor_id}`;
    if (vistos.has(key)) duplicados++;
    vistos.add(key);
  }
  if (duplicados > 0) throw new Error(`${duplicados} duplicados encontrados — el indice unico NO esta activo`);
  return { resoluciones_revisadas: data.length };
});

console.log('\n=== migracion_realtime.sql (policies de lectura publica) ===');
for (const tabla of ['reacciones', 'valoraciones_progreso', 'fotos_denuncia']) {
  await check(`${tabla}: anon puede leer (policy activa)`, async () => {
    const { error } = await anon.from(tabla).select('id').limit(1);
    if (error) throw error;
  });
}

console.log('\n=== vista_denuncias_admin (usada por /admin) ===');
await check('vista_denuncias_admin responde', async () => {
  const { error } = await admin.from('vista_denuncias_admin').select('id, estado').limit(1);
  if (error) throw error;
});

console.log('\n=== RLS: casos negativos ===');
await check('anon NO puede insertar denuncias directo (bypass del backend)', async () => {
  const { error } = await anon.from('denuncias').insert({
    categoria_id: 1, zona_id: 1, descripcion: 'prueba RLS — verificar-migraciones.mjs', gravedad: 1,
  }).select();
  if (!error) throw new Error('INSERT anon fue PERMITIDO — hueco de seguridad');
});
await check('anon ve 0 perfiles ajenos', async () => {
  const { data, error } = await anon.from('perfiles').select('id');
  if (error) throw error;
  if (data.length > 0) throw new Error(`anon ve ${data.length} perfiles — hueco de seguridad`);
});
await check('anon SI puede leer denuncias (dato publico)', async () => {
  const { error } = await anon.from('denuncias').select('id').limit(1);
  if (error) throw error;
});

console.log(`\n${fallas === 0 ? '✅ Todo en orden.' : `❌ ${fallas} check(s) fallaron — revisar arriba.`}`);
process.exit(fallas === 0 ? 0 : 1);
