import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

/** Tablas cuyos cambios pueden alterar lo que muestra vista_denuncias en el muro. */
export const MURO_REALTIME_TABLAS = [
  'denuncias',
  'reacciones',
  'valoraciones_progreso',
  'aportes',
  'fotos_denuncia',
];

export const MURO_REALTIME_DEBOUNCE_MS = 600;

/**
 * Suscripción Supabase Realtime: al detectar cambios comunitarios, invoca onRefresh
 * (debounced) para re-fetch del muro vía API.
 */
export function useMuroRealtime(onRefresh) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const timerRef = useRef(null);

  useEffect(() => {
    function scheduleRefresh() {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onRefreshRef.current?.();
      }, MURO_REALTIME_DEBOUNCE_MS);
    }

    const channel = supabase.channel('muro-en-vivo');

    for (const table of MURO_REALTIME_TABLAS) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        scheduleRefresh,
      );
    }

    channel.subscribe();

    return () => {
      clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, []);
}
