import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Muro from './pages/Muro';
import Login from './pages/Login';
import DetalleDenuncia from './pages/DetalleDenuncia';

function App() {
  const [session, setSession] = useState(undefined); // undefined = cargando

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-faint font-mono text-sm">
        Cargando…
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* El muro es público — cualquiera puede ver */}
        <Route path="/" element={<Muro session={session} />} />
        <Route path="/denuncia/:id" element={<DetalleDenuncia session={session} />} />
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
