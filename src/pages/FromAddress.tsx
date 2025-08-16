import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { generateUDPIN, formatUDPIN } from '../lib/udpin';
import { reverseGeocode } from '../lib/geocoding';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Define props for LocationMarker component
interface LocationMarkerProps {
  position: [number, number] | null;
  onPositionChange: (lat: number, lng: number) => Promise<void>;
}

// Interactive marker component
const LocationMarker: React.FC<LocationMarkerProps> = ({ position, onPositionChange }) => {
  const map = useMap();
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(position);
  const markerRef = useRef<L.Marker>(null);

  // Update local position when prop changes
  useEffect(() => {
    if (position) {
      setCurrentPosition(position);
      map.flyTo(position, map.getZoom(), { duration: 0.5 });
    }
  }, [position, map]);

  // Handle marker drag end
  const handleDragEnd = useCallback(async () => {
    const marker = markerRef.current;
    if (marker) {
      const { lat, lng } = marker.getLatLng();
      await onPositionChange(lat, lng);
    }
  }, [onPositionChange]);

  // Handle map click
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      await onPositionChange(lat, lng);
    },
  });

  if (!currentPosition) return null;

  return (
    <Marker
      draggable={true}
      eventHandlers={{
        dragend: handleDragEnd,
      }}
      position={currentPosition}
      ref={markerRef}
    >
      <Popup minWidth={200}>
        <div>
          <p>Drag me or click on the map to move</p>
          <p>Lat: {currentPosition[0].toFixed(6)}</p>
          <p>Lng: {currentPosition[1].toFixed(6)}</p>
        </div>
      </Popup>
    </Marker>
  );
};



const FromAddress = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState('');
  const [locationName, setLocationName] = useState('');
  const [udpin, setUdpin] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<L.Map>(null);

  // Function to update location data
  const updateLocationData = useCallback(async (lat: number, lng: number) => {
    try {
      setIsLoading(true);
      const [newUdpin, addr] = await Promise.all([
        formatUDPIN(generateUDPIN(lat, lng)),
        reverseGeocode(lat, lng)
      ]);
      
      setUdpin(newUdpin);
      setAddress(addr);
      
      // Update position state
      setPosition([lat, lng]);
      
      // Update map view if needed
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lng], mapRef.current.getZoom(), {
          animate: true,
          duration: 0.5,
        });
      }
    } catch (error) {
      console.error('Error updating location:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize with default position
  useEffect(() => {
    const initPosition = async () => {
      try {
        if (navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            });
          });
          const { latitude, longitude } = position.coords;
          await updateLocationData(latitude, longitude);
        } else {
          throw new Error('Geolocation not supported');
        }
      } catch (error) {
        console.error('Error getting location, defaulting to India:', error);
        await updateLocationData(20.5937, 78.9629); // Default to India
      }
    };

    initPosition();
  }, [updateLocationData]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        await updateLocationData(parseFloat(lat), parseFloat(lon));
      } else {
        alert('No results found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      alert('Failed to find location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyAddressToLocation = () => {
    setLocationName(address);
  };

  const handleSaveLocation = () => {
    console.log('Location saved:', { position, address, locationName, udpin });
    alert('Location saved successfully!');
  };

  // If position is not yet available, show a simple loading message
  if (!position) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-600 font-medium">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">From Address</h1>
      </div>
      
      <div className="flex-1 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
        <div className="p-4 border-b">
          <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                id="from-location-search"
                name="fromLocationSearch"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search location..."
                aria-label="Search for a location"
                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            <button 
              type="submit" 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>
          
          <div className="flex-1 relative">
            {/* MapContainer is always rendered if position is available (handled by early return) */}
            <MapContainer
              center={position}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
              className="z-0"
              whenReady={() => {
                // Map is ready
              }}
              ref={(map) => {
                if (map) mapRef.current = map;
              }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationMarker 
                position={position} 
                onPositionChange={async (lat, lng) => {
                  await updateLocationData(lat, lng);
                }}
              />
            </MapContainer>
            
            {/* Loading overlay is a conditional child, positioned absolutely on top of the map */}
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                <div className="bg-white p-4 rounded-lg">
                  <p>Loading map...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t">
            <div className="mb-4">
              <label htmlFor="from-location-name" className="block text-sm font-medium text-gray-700 mb-1">
                Location Name
              </label>
              <div className="flex gap-2">
                <input
                  id="from-location-name"
                  name="fromLocationName"
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Enter location name"
                  className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Location name"
                />
                <button
                  type="button"
                  onClick={copyAddressToLocation}
                  className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  title="Copy from address"
                >
                  📋
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="from-location-address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                id="from-location-address"
                name="fromLocationAddress"
                value={address}
                readOnly
                className="w-full p-2 border rounded bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                aria-label="Location address"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UDPIN
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={udpin}
                  readOnly
                  className="flex-1 p-2 border rounded bg-gray-50 font-mono"
                  aria-label="UDPIN code"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(udpin);
                    alert('UDPIN copied to clipboard!');
                  }}
                  className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  title="Copy UDPIN"
                >
                  📋
                </button>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleSaveLocation}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Location'}
            </button>
          </div>
        </div>
      </div>
  );
};

export default FromAddress;