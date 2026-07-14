import 'dotenv/config';
import { createApp } from './app.js';

const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`\n❌ Variables de entorno faltantes: ${missing.join(', ')}`);
  console.error('   Copia backend/.env.example a backend/.env y completa los valores.\n');
  process.exit(1);
}

const PORT = process.env.PORT || 4000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`✅ PortoSinFiltro API corriendo en http://localhost:${PORT}`);
});
