import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { PORTOVIEJO } from './MapaUbicacion';
import { ESTADO_LABEL } from '../../lib/constants';

const COLOR_ESTADO = {
  activa:     '#B83232',
  con_avance: '#C87D00',
  resuelta:   '#0E7A45',
};

const iconoPorEstado = {};
function iconoEstado(estado) {
  const color = COLOR_ESTADO[estado] ?? '#555';
  if (!iconoPorEstado[estado]) {
    iconoPorEstado[estado] = L.divIcon({
      className: '',
      html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);"></span>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -8],
    });
  }
  return iconoPorEstado[estado];
}

// Mapa agregado: un pin por cada denuncia con coordenadas, agrupados por
// cercanía (clustering) y coloreados por estado.
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
        <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
          {denuncias.map(d => (
            <Marker
              key={d.id}
              position={[d.latitud, d.longitud]}
              icon={iconoEstado(d.estado)}
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
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
