import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
// @ts-expect-error
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface MapUpdaterProps {
  center: [number, number] | null;
  isLoading: boolean;
  mapRef: React.RefObject<L.Map | null>;
}

const MapUpdater: React.FC<MapUpdaterProps> = ({ center, isLoading, mapRef }) => {
  const map = useMap();

  useEffect(() => {
    if (mapRef.current && !isLoading) {
      mapRef.current.invalidateSize();
    }
  }, [isLoading, mapRef]);

  useEffect(() => {
    if (center && mapRef.current) {
      map.flyTo(center, map.getZoom(), {
        animate: true,
        duration: 0.5,
      });
    }
  }, [center, map]);

  return null;
};

interface MapComponentProps {
  center: [number, number];
  zoom?: number;
  isLoading: boolean;
  children: React.ReactNode;
}

const MapComponent: React.FC<MapComponentProps> = ({ center, zoom = 15, isLoading, children }) => {
  const mapRef = useRef<L.Map>(null);

  return (
    <div className="relative w-full flex-1">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        className="z-0"
        ref={mapRef} // Direct ref assignment
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapUpdater center={center} isLoading={isLoading} mapRef={mapRef} />
        {children}
      </MapContainer>

      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-4 rounded-lg">
            <p>Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;