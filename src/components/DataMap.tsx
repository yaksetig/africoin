import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface MapDataItem {
  [key: string]: string;
}

interface DataMapProps {
  data: MapDataItem[];
}

const DataMap: React.FC<DataMapProps> = ({ data }) => {
  const markers = data
    .map((item) => {
      const coord =
        item['GeographicCoordinates'] || item['Geographic Coordinates'];
      if (!coord) return null;
      const [latStr, lngStr] = coord.split(',').map((s: string) => s.trim());
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (isNaN(lat) || isNaN(lng)) return null;
      const label = item[Object.keys(item)[0]] || '';
      return { lat, lng, label };
    })
    .filter((m): m is { lat: number; lng: number; label: string } => !!m);

  const center = markers.length > 0 ? [markers[0].lat, markers[0].lng] : [0, 0];

  return (
    <MapContainer
      center={center as [number, number]}
      zoom={2}
      style={{ height: '400px', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((m, idx) => (
        <Marker key={idx} position={[m.lat, m.lng]}>
          <Popup>{m.label}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default DataMap;
