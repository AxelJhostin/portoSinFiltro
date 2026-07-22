import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { PORTOVIEJO } from './MapaUbicacion';
import { ESTADO_LABEL } from '../../lib/constants';

const COLOR_ESTADO = {
  activa:     '#B83232',
  con_avance: '#C87D00',
  resuelta:   '#0E7A45',
};

// Mapa agregado: un pin por cada denuncia con coordenadas, coloreado por estado.
export default function MapaDenuncias({ denuncias, alto = 'h-[28rem]' }) {
  return (
    <div className={`w-full ${alto} rounded-card overflow-hidden border border-surface-muted`}>
      <MapContainer
        center={PORTOVIEJO}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {denuncias.map(d => (
          <CircleMarker
            key={d.id}
            center={[d.latitud, d.longitud]}
            radius={9}
            pathOptions={{
              color: '#fff',
              weight: 2,
              fillColor: COLOR_ESTADO[d.estado] ?? '#555',
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <div className="text-sm space-y-1 min-w-[10rem]">
                <p className="font-semibold leading-snug">{d.titular}</p>
                <p className="text-xs text-ink-soft">{d.categoria} · {d.zona}</p>
                <p className="text-xs font-semibold" style={{ color: COLOR_ESTADO[d.estado] }}>
                  {ESTADO_LABEL[d.estado] ?? d.estado}
                </p>
                <Link to={`/denuncia/${d.id}`} className="text-brand-red text-xs font-semibold hover:underline">
                  Ver denuncia →
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
