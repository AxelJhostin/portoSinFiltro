import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Muro from './pages/Muro';
import Login from './pages/Login';
import DetalleDenuncia from './pages/DetalleDenuncia';
import NuevaDenuncia from './pages/NuevaDenuncia';
import Panel from './pages/Panel';
import MisDenuncias from './pages/MisDenuncias';
import NotFound from './pages/NotFound';

function App() {
  const [session, setSession] = useState(undefined); // undefined = cargando
  const [perfil, setPerfil]   = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Cargar perfil (nombre, rol) cuando hay sesión activa
  useEffect(() => {
    if (!session?.user) { setPerfil(null); return; }
    supabase
      .from('perfiles')
      .select('id, nombre, rol')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setPerfil(data ?? null));
  }, [session]);

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-faint font-mono text-sm">
        Cargando…
      </div>
    );
  }

  const shared = { session, perfil };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<Muro {...shared} />} />
        <Route path="/denuncia/:id"  element={<DetalleDenuncia {...shared} />} />
        <Route path="/nueva"         element={<NuevaDenuncia {...shared} />} />
        <Route path="/panel"         element={<Panel {...shared} />} />
        <Route path="/mis-denuncias" element={<MisDenuncias {...shared} />} />
        <Route path="/login"         element={session ? <Navigate to="/" replace /> : <Login />} />
        <Route path="*"              element={<NotFound {...shared} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
