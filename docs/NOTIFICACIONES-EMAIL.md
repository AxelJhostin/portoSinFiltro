# Notificaciones por email

La función `notify-status` avisa al autor de una denuncia únicamente cuando el estado comunitario cambia tras un aporte o una valoración de progreso.

## Contrato

El backend invoca `POST /functions/v1/notify-status` con un JWT de servicio válido y este payload:

```json
{
  "to": "ciudadano@example.com",
  "titulo": "Texto de la denuncia",
  "estado": "con_avance",
  "estadoLabel": "CON AVANCE"
}
```

Estados válidos: `activa`, `con_avance` y `resuelta`. No se envían correos cuando un aporte o voto no cambia el estado, ni para acciones administrativas, errores de carga o denuncias nuevas.

## Activación

1. En Resend, verificar el dominio remitente y crear una API key.
2. En Supabase → Edge Functions → Secrets, configurar `RESEND_API_KEY` y `EMAIL_FROM` (por ejemplo, `PortoSinFiltro <avisos@tu-dominio>`).
3. Desplegar `supabase/functions/notify-status` con JWT obligatorio.
4. En el entorno del backend, establecer `NOTIFICATIONS_ENABLED=true` y reiniciarlo.

Mientras falte algún secreto, la función responde `503` y el backend registra el fallo sin impedir que el ciudadano vote o aporte. Para pruebas, usar un destinatario autorizado por el sandbox de Resend y comprobar los logs de Edge Functions; los reintentos cubren un error temporal o `429`.
