import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { generateUDPIN, decodeUDPIN, formatUDPIN, isValidUDPIN } from '../lib/udpin';
import { reverseGeocode } from '../lib/geocoding';
import L from 'leaflet';
import { saveToAddressData, loadToAddressData } from '../lib/appStorage'; // Import storage functions

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Helper component to update map view and invalidate size
const MapUpdater = ({ position, isLoading, mapRef }: { position: [number, number] | null; isLoading: boolean; mapRef: React.RefObject<L.Map | null> }) => {
  const map = useMap();

  useEffect(() => {
    if (mapRef.current && !isLoading) {
      mapRef.current.invalidateSize();
    }
  }, [isLoading, mapRef]);

  useEffect(() => {
    if (position && mapRef.current) {
      map.flyTo(position, map.getZoom(), {
        animate: true,
        duration: 0.5,
      });
    }
  }, [position, map]);

  return null;
};

const ToAddress = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState('');
  const [locationName, setLocationName] = useState('');
  const [udpin, setUdpin] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState(''); // New state for Name
  const [phone, setPhone] = useState(''); // New state for Phone no
  const mapRef = useRef<L.Map>(null);

  const initialMapCenter: [number, number] = [20.5937, 78.9629]; // Default to India

  const updateLocationData = useCallback(async (lat: number, lng: number) => {
    try {
      setIsLoading(true);
      const [newUdpin, addr] = await Promise.all([
        formatUDPIN(generateUDPIN(lat, lng)),
        reverseGeocode(lat, lng)
      ]);
      
      setUdpin(newUdpin);
      setAddress(addr);
      setPosition([lat, lng]);
      
    } catch (error) {
      console.error('Error updating location:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initPosition = async () => {
      try {
        setIsLoading(true);
        let newPosition: [number, number];
        const savedData = loadToAddressData();

        if (savedData) {
          newPosition = [savedData.lat, savedData.lng];
          setName(savedData.name);
          setPhone(savedData.phone);
          setLocationName(savedData.address); // Assuming locationName stores the address for now
          setUdpin(savedData.udpin);
          setAddress(savedData.address);
        } else {
          newPosition = initialMapCenter; // Default to India
        }
        
        setPosition(newPosition);
        // Only update location data if it wasn't loaded from storage
        if (!savedData) {
          await updateLocationData(initialMapCenter[0], initialMapCenter[1]); 
        } else {
          setIsLoading(false); // If loaded from storage, stop loading
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      } finally {
        setIsLoading(false);
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
      
      if (!response.ok) throw new Error('Failed to fetch location');
      
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

  const handleDecodeUDPIN = async () => {
    if (!udpin.trim()) {
      alert('Please enter a UDPIN to decode.');
      return;
    }
    if (!isValidUDPIN(udpin)) {
      alert('Invalid UDPIN format. Please check the code.');
      return;
    }

    try {
      setIsLoading(true);
      const { lat, lng } = decodeUDPIN(udpin);
      await updateLocationData(lat, lng);
    } catch (error) {
      console.error('Error decoding UDPIN:', error);
      alert('Failed to decode UDPIN. Please check the format.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyAddressToLocation = () => {
    setLocationName(address);
  };

  const handleSaveLocation = () => {
    if (position) {
      saveToAddressData({
        name,
        phone,
        address,
        udpin,
        lat: position[0],
        lng: position[1],
      });
      alert('To Address saved successfully!');
    } else {
      alert('Cannot save: location not set.');
    }
  };

  return (
    <div className="flex flex-col">
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">To Address</h1>
      </div>

      <div className="flex flex-col">
        <div className="p-4 border-b">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              id="to-location-search"
              name="toLocationSearch"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location..."
              aria-label="Search for a location"
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        <div className="relative w-full" style={{ height: '300px' }}>
          <MapContainer
            center={position || initialMapCenter} // Use current position or default
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            className="z-0"
            ref={(map) => {
              if (map) mapRef.current = map;
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {position && (
              <Marker position={position}>
                <Popup>
                  <div>
                    <p>Lat: {position[0].toFixed(4)}</p>
                    <p>Lng: {position[1].toFixed(4)}</p>
                    <p>UDPIN: {udpin}</p>
                  </div>
                </Popup>
              </Marker>
            )}
            <MapUpdater position={position} isLoading={isLoading} mapRef={mapRef} />
          </MapContainer>
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
            <label htmlFor="to-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              id="to-name"
              name="toName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter recipient's name"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Recipient's name"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="to-phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone no
            </label>
            <input
              id="to-phone"
              name="toPhone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter recipient's phone number"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Recipient's phone number"
            />
          </div>

          <div className="form-group mb-4">
            <label htmlFor="to-location-address" className="block text-sm font-medium text-gray-700 mb-1">
              Geo Location (Address):
            </label>
            <div className="input-group">
              <textarea 
                id="to-location-address"
                name="toLocationAddress"
                value={address} 
                readOnly 
                aria-label="Location address"
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                rows={3}
              />
            </div>
          </div>

          <div className="form-group mb-4">
            <label htmlFor="to-location-name" className="block text-sm font-medium text-gray-700 mb-1">
              My Location Name:
            </label>
            <div className="flex gap-2">
              <input
                id="to-location-name"
                name="toLocationName"
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Enter location name"
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Location name"
              />
              <button 
                type="button"
                onClick={copyAddressToLocation}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Copy Address to Name
              </button>
            </div>
          </div>

          <div className="form-group mb-4">
            <label htmlFor="to-udpin" className="block text-sm font-medium text-gray-700 mb-1">
              Digital Pin:
            </label>
            <div className="flex items-center gap-2">
              <input
                id="to-udpin"
                name="toUdpin"
                type="text"
                value={udpin}
                onChange={(e) => setUdpin(e.target.value)}
                placeholder="Enter UDPIN to decode"
                className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-50 font-mono"
                aria-label="UDPIN code"
              />
              <button 
                type="button"
                onClick={handleDecodeUDPIN}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={isLoading}
              >
                Decode
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

export default ToAddress;