#!/usr/bin/env node
/**
 * Verifica rate limiting del backend PortoSinFiltro.
 *
 * Requisito: backend corriendo (npm run dev en otra terminal).
 *
 * Uso:
 *   npm run test:rate-limit              # límite global (100 req / 15 min)
 *   npm run test:rate-limit -- --write   # límite escritura aportes (20 req / 15 min)
 *
 * Variables de entorno:
 *   API_URL       — base URL (default http://localhost:4000)
 *
 * Nota: el contador es por IP y ventana de 15 min. Si una prueba falla o ya
 * consumiste cuota, reinicia el backend (Ctrl+C → npm run dev) y vuelve a intentar.
 * Para probar ambos límites, ejecuta cada modo con el servidor recién reiniciado.
 */

const API_URL = process.env.API_URL ?? 'http://localhost:4000';
const WRITE_MODE = process.argv.includes('--write');

const LIMITS = {
  global: { max: 100, path: '/health', method: 'GET', label: 'global (GET /health)' },
  write: {
    max: 20,
    path: '/denuncias/1/aportes',
    method: 'POST',
    label: 'escritura aportes (POST /denuncias/:id/aportes)',
    body: { tipo: 'detalle', contenido: 'Prueba rate limit script' },
  },
};

async function request(config, i) {
  const url = `${API_URL}${config.path}`;
  const opts = {
    method: config.method,
    headers: config.body ? { 'Content-Type': 'application/json' } : undefined,
    body: config.body ? JSON.stringify(config.body) : undefined,
  };
  const res = await fetch(url, opts);
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* respuesta vacía */
  }
  return { n: i, status: res.status, json };
}

function logProgress(i, status, config) {
  const show = i <= 3 || status === 429 || i === config.max || i === config.max + 1;
  if (show) console.log(`  #${i} → HTTP ${status}`);
  else if (i === 4) console.log('  ...');
}

async function runLimitTest(mode) {
  const config = LIMITS[mode];
  console.log(`\n=== Límite ${config.label} — máx. ${config.max} req / 15 min ===`);
  console.log(`    Target: ${API_URL}${config.path}`);

  let first429 = null;
  let lastOk = 0;
  const buffer = 10;

  for (let i = 1; i <= config.max + buffer; i++) {
    const { status, json } = await request(config, i);
    logProgress(i, status, config);

    if (status === 429) {
      first429 = i;
      console.log(`  Mensaje: ${json?.error ?? '(sin mensaje)'}`);
      break;
    }
    if (status < 400) lastOk = i;
  }

  if (!first429) {
    console.error(`\n❌ FAIL: no se recibió HTTP 429 tras ${config.max + buffer} peticiones.`);
    console.error('   ¿Está corriendo el backend? ¿Ya consumiste la cuota? Reinicia npm run dev.');
    return false;
  }

  if (first429 !== config.max + 1) {
    console.warn(`\n⚠️  429 en petición #${first429} (esperado idealmente en #${config.max + 1}).`);
    console.warn('   Puede deberse a cuota parcial previa en esta IP.');
  }

  console.log(`\n✅ PASS: HTTP 429 confirmado en petición #${first429} (último OK: #${lastOk}).`);
  return true;
}

async function checkServer() {
  try {
    const res = await fetch(`${API_URL}/health`);
    if (!res.ok) throw new Error(`health → ${res.status}`);
  } catch (err) {
    console.error(`\n❌ No se pudo conectar a ${API_URL}`);
    console.error(`   ${err.message}`);
    console.error('   Arranca el backend: cd backend && npm run dev\n');
    process.exit(1);
  }
}

async function main() {
  console.log('PortoSinFiltro — prueba de rate limiting');
  await checkServer();

  const mode = WRITE_MODE ? 'write' : 'global';
  const ok = await runLimitTest(mode);

  if (!ok) process.exit(1);

  if (!WRITE_MODE) {
    console.log('\nTip: prueba el límite de escritura (20 req) con el backend recién reiniciado:');
    console.log('  npm run test:rate-limit -- --write\n');
  }
}

main();
