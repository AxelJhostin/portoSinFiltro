import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';

export default function NotFound({ session, perfil }) {
  return (
    <Layout session={session} perfil={perfil}>
      <div className="flex flex-col items-center justify-center py-32 text-center px-4">
        <p className="font-headline text-8xl text-surface-muted mb-4">404</p>
        <h2 className="font-headline text-2xl mb-2">Página no encontrada</h2>
        <p className="text-ink-soft text-sm mb-6 max-w-xs">
          Esta URL no existe. Puede que la denuncia haya sido eliminada o que el enlace esté roto.
        </p>
        <Link to="/" className="btn-primary">
          ← Volver al Muro
        </Link>
      </div>
    </Layout>
  );
}
