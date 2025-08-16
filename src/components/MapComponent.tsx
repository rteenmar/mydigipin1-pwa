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
  center: [number, number]; // Now guaranteed to be valid
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
    // Ensure center is valid before flying to it
    if (center && !isNaN(center[0]) && !isNaN(center[1]) && mapRef.current) {
      map.flyTo(center, map.getZoom(), {
        animate: true,
        duration: 0.5,
      });
    }
  }, [center, map]);

  return null;
};

interface MapComponentProps {
  center: [number, number]; // Now guaranteed to be valid
  zoom?: number;
  isLoading: boolean;
  children: React.ReactNode;
}

const MapComponent: React.FC<MapComponentProps> = ({ center, zoom = 15, isLoading, children }) => {
  const mapRef = useRef<L.Map>(null);
  const initialMapCenter: [number, number] = [20.5937, 78.9629]; // Default to India

  // Ensure center is always valid before passing to MapContainer and MapUpdater
  // This is the most critical part to prevent NaN from reaching Leaflet.
  const finalCenter: [number, number] = [
    isNaN(center[0]) ? initialMapCenter[0] : center[0],
    isNaN(center[1]) ? initialMapCenter[1] : center[1]
  ];

  return (
    <div className="relative w-full flex-1">
      <MapContainer
        center={finalCenter} // Use finalCenter here, guaranteed to be valid
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
        <MapUpdater center={finalCenter} isLoading={isLoading} mapRef={mapRef} /> {/* Use finalCenter here */}
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