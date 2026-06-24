import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

// Centro aproximado de Portoviejo, Manabí
export const PORTOVIEJO = [-1.0546, -80.4545];

function CapturarClick({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Mapa reutilizable.
//  - editable=true  → al hacer clic coloca/mueve el marcador y llama onSelect(lat, lng)
//  - editable=false → solo muestra el marcador (lectura)
export default function MapaUbicacion({
  lat,
  lng,
  onSelect,
  editable = false,
  alto = 'h-64',
}) {
  const tieneCoords = lat != null && lng != null;
  const centro = tieneCoords ? [lat, lng] : PORTOVIEJO;

  return (
    <div className={`w-full ${alto} rounded-card overflow-hidden border border-surface-muted`}>
      <MapContainer
        center={centro}
        zoom={tieneCoords ? 16 : 13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {editable && <CapturarClick onSelect={onSelect} />}
        {tieneCoords && <Marker position={[lat, lng]} />}
      </MapContainer>
    </div>
  );
}
