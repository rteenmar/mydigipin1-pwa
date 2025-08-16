import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { generateUDPIN, formatUDPIN } from '../lib/udpin';
import { reverseGeocode } from '../lib/geocoding';

// Custom marker icons
const createCustomIcon = (color: string) => {
  const svgTemplate = (color: string) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <path fill="${color}" stroke="#fff" stroke-width="2" d="M16 2a10 10 0 0 0-10 10c0 8 10 18 10 18s10-10 10-18a10 10 0 0 0-10-10z"/>
    </svg>`;
  
  return new L.DivIcon({
    html: svgTemplate(color),
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};
const FROM_ICON = createCustomIcon('#3b82f6'); // Blue
const TO_ICON = createCustomIcon('#ef4444');    // Red
const CURRENT_ICON = createCustomIcon('#10b981'); // Green

interface PointData {
  position: [number, number];
  address: string;
  udpin: string;
  name: string;
}

interface MultiPointMapProps {
  onUpdatePoints: (points: {
    from: PointData;
    to: PointData;
    current: PointData;
  }) => void;
  initialPosition?: [number, number];
}

const MultiPointMap: React.FC<MultiPointMapProps> = ({ 
  onUpdatePoints,
  initialPosition = [20.5937, 78.9629] // Default to India
}) => {
  const [points, setPoints] = useState({
    from: {
      position: initialPosition,
      address: '',
      udpin: '',
      name: 'From'
    },
    to: {
      position: [initialPosition[0] + 0.01, initialPosition[1] + 0.01] as [number, number],
      address: '',
      udpin: '',
      name: 'To'
    },
    current: {
      position: initialPosition,
      address: '',
      udpin: '',
      name: 'Current Location'
    }
  });

  const [activePoint, setActivePoint] = useState<'from' | 'to' | 'current'>('current');
  const [isLoading, setIsLoading] = useState(true);

  // Update location data for a point
  const updatePointData = useCallback(async (type: 'from' | 'to' | 'current', position: [number, number]) => {
    try {
      const [udpin, address] = await Promise.all([
        formatUDPIN(generateUDPIN(position[0], position[1])),
        reverseGeocode(position[0], position[1])
      ]);

      setPoints(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          position,
          address,
          udpin
        }
      }));

      return { position, address, udpin, name: points[type].name };
    } catch (error) {
      console.error(`Error updating ${type} point:`, error);
      return null;
    }
  }, [points]);

  // Initialize with current location
  useEffect(() => {
    const initCurrentLocation = async () => {
      try {
        if (navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            });
          });

          const newPosition: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];

          // Update current location
          await updatePointData('current', newPosition);
          
          // Slightly offset the 'to' point for better visibility
          const toPosition: [number, number] = [
            newPosition[0] + 0.01,
            newPosition[1] + 0.01
          ];
          await updatePointData('to', toPosition);
        }
      } catch (error) {
        console.error('Error getting current location:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initCurrentLocation();
  }, [updatePointData]);

  // Notify parent when points change
  useEffect(() => {
    onUpdatePoints({
      from: points.from,
      to: points.to,
      current: points.current
    });
  }, [points, onUpdatePoints]);

  // Handle map click
  const handleMapClick = async (e: L.LeafletMouseEvent) => {
    if (activePoint === 'current') return; // Don't move current location marker

    const newPosition: [number, number] = [e.latlng.lat, e.latlng.lng];
    await updatePointData(activePoint, newPosition);
  };

  // Handle marker drag end
  const handleDragEnd = async (e: L.LeafletEvent, type: 'from' | 'to' | 'current') => {
    if (type === 'current') return; // Don't allow dragging current location
    
    const marker = e.target as L.Marker;
    const position = marker.getLatLng();
    await updatePointData(type, [position.lat, position.lng]);
  };

  // Map event handler component
  const MapEvents = () => {
    const map = useMap();
    
    useEffect(() => {
      map.on('click', handleMapClick);
      return () => {
        map.off('click', handleMapClick);
      };
    }, [map, activePoint]);
    
    return null;
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Point selector */}
      <div className="flex space-x-2 p-2 bg-gray-100">
        <button
          onClick={() => setActivePoint('from')}
          className={`px-4 py-2 rounded ${activePoint === 'from' ? 'bg-blue-500 text-white' : 'bg-white'}`}
        >
          From
        </button>
        <button
          onClick={() => setActivePoint('to')}
          className={`px-4 py-2 rounded ${activePoint === 'to' ? 'bg-red-500 text-white' : 'bg-white'}`}
        >
          To
        </button>
        <button
          onClick={() => setActivePoint('current')}
          className={`px-4 py-2 rounded ${activePoint === 'current' ? 'bg-green-500 text-white' : 'bg-white'}`}
        >
          Current Location
        </button>
      </div>

      {/* Map container */}
      <div className="flex-1 relative">
        <MapContainer
          center={points.current.position}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <MapEvents />
          
          {/* From Marker */}
          <Marker
            position={points.from.position}
            icon={FROM_ICON}
            draggable={activePoint === 'from'}
            eventHandlers={{
              dragend: (e) => handleDragEnd(e, 'from')
            }}
          >
            <Popup>
              <div>
                <h3 className="font-bold">From</h3>
                <p>{points.from.address}</p>
                <p className="font-mono text-sm mt-1">UDPIN: {points.from.udpin}</p>
              </div>
            </Popup>
          </Marker>
          
          {/* To Marker */}
          <Marker
            position={points.to.position}
            icon={TO_ICON}
            draggable={activePoint === 'to'}
            eventHandlers={{
              dragend: (e) => handleDragEnd(e, 'to')
            }}
          >
            <Popup>
              <div>
                <h3 className="font-bold">To</h3>
                <p>{points.to.address}</p>
                <p className="font-mono text-sm mt-1">UDPIN: {points.to.udpin}</p>
              </div>
            </Popup>
          </Marker>
          
          {/* Current Location Marker */}
          <Marker
            position={points.current.position}
            icon={CURRENT_ICON}
            draggable={false}
          >
            <Popup>
              <div>
                <h3 className="font-bold">Current Location</h3>
                <p>{points.current.address}</p>
                <p className="font-mono text-sm mt-1">UDPIN: {points.current.udpin}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      
      {/* Active point info */}
      <div className="p-4 bg-white border-t">
        <h3 className="font-bold mb-2">
          {activePoint === 'from' && 'From Location'}
          {activePoint === 'to' && 'To Location'}
          {activePoint === 'current' && 'Your Current Location'}
        </h3>
        <p className="text-gray-700 mb-2">
          {points[activePoint].address || 'No address available'}
        </p>
        <div className="flex items-center">
          <span className="font-mono bg-gray-100 p-2 rounded text-sm">
            {points[activePoint].udpin || 'Generating UDPIN...'}
          </span>
          <button
            onClick={() => {
              if (points[activePoint].udpin) {
                navigator.clipboard.writeText(points[activePoint].udpin);
                alert('UDPIN copied to clipboard!');
              }
            }}
            className="ml-2 p-2 text-gray-500 hover:text-gray-700"
            title="Copy UDPIN"
          >
            📋
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiPointMap;