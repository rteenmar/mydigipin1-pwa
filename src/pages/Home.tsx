import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { generateUDPIN, formatUDPIN } from '../lib/udpin';
import { reverseGeocode } from '../lib/geocoding';

// Fix for default marker icons in Leaflet with React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const LocationMarker = ({ position, onPositionChange, popupText }: {
  position: [number, number] | null;
  onPositionChange: (pos: [number, number]) => void;
  popupText: string;
}) => {
  useMapEvents({
    click(e) {
      const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
      onPositionChange(newPos);
    },
  });

  if (!position) return null;

  return (
    <Marker position={position}>
      <Popup>{popupText}</Popup>
    </Marker>
  );
};

const HomePage = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState('');
  const [udpin, setUdpin] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<L.Map>(null);

  // Update location data function
  const updateLocationData = useCallback(async (pos: [number, number]) => {
    try {
      // Batch state updates
      const [newUdpin, addr] = await Promise.all([
        formatUDPIN(generateUDPIN(pos[0], pos[1])),
        reverseGeocode(pos[0], pos[1]).catch(() => 'Address not available')
      ]);
      
      setUdpin(newUdpin);
      setAddress(addr);
      
      // Update map view if ref exists
      if (mapRef.current) {
        mapRef.current.flyTo(pos, 15, {
          animate: true,
          duration: 1.5,
        });
      }
      
      return addr;
    } catch (error) {
      console.error('Error updating location data:', error);
      setAddress('Address not available');
      return 'Address not available';
    }
  }, []);

  // Handle position changes
  const handlePositionChange = useCallback((newPosition: [number, number]) => {
    setPosition(newPosition);
    updateLocationData(newPosition);
  }, [updateLocationData]);

  // Memoize the map component to prevent unnecessary re-renders
  const MapComponent = useMemo(() => {
    if (!position) return null;
    
    return (
      <MapContainer
        key={`map-${position[0]}-${position[1]}`}
        center={position}
        zoom={15}
        style={{ height: '100%', width: '100%', minHeight: '100%' }}
        zoomControl={true}
        ref={mapRef}
        whenReady={() => {}}
        preferCanvas={true}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker 
          position={position} 
          onPositionChange={handlePositionChange}
          popupText={`Your location: ${address || 'Unknown address'}`}
        />
      </MapContainer>
    );
  }, [position, address, handlePositionChange]);

  // Initialize map position and data
  useEffect(() => {
    let isMounted = true;
    
    const initMap = async () => {
      try {
        setIsLoading(true);
        
        // Get current position or use default
        let newPosition: [number, number];
        
        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
              });
            });
            
            if (!isMounted) return;
            newPosition = [position.coords.latitude, position.coords.longitude];
          } catch (error) {
            console.log('Using default position due to geolocation error:', error);
            if (!isMounted) return;
            newPosition = [20.5937, 78.9629]; // Default to India
          }
        } else {
          newPosition = [20.5937, 78.9629]; // Default to India
        }
        
        if (!isMounted) return;
        
        // Update position and location data in a single state update
        await updateLocationData(newPosition);
        setPosition(newPosition);
        
      } catch (error) {
        console.error('Error initializing map:', error);
        if (!isMounted) return;
        
        const defaultPosition: [number, number] = [20.5937, 78.9629];
        setPosition(defaultPosition);
        await updateLocationData(defaultPosition);
      } finally {
        if (isMounted) {
          // Add a small delay to ensure smooth transition
          setTimeout(() => {
            setIsLoading(false);
          }, 500);
        }
      }
    };
    
    initMap();
    
    return () => {
      isMounted = false;
    };
  }, []);





  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    try {
      setIsLoading(true);
      // For now, we'll just log the search query since searchLocation isn't implemented
      console.log('Searching for:', searchQuery);
      // In a real implementation, you would call searchLocation here
      // const results = await searchLocation(searchQuery);
      // if (results.length > 0) {
      //   const newPosition: [number, number] = [results[0].lat, results[0].lon];
      //   handlePositionChange(newPosition);
      // }
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Welcome Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to MyDigiPin</h1>
        <p className="text-gray-600">Your digital addressing system for precise location sharing</p>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link 
          to="/from-address" 
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2 text-blue-600">From Address</h2>
          <p className="text-gray-600">Set your starting point and generate a digital address</p>
        </Link>
        
        <Link 
          to="/to-address" 
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2 text-green-600">To Address</h2>
          <p className="text-gray-600">Set your destination and get the digital address</p>
        </Link>
        
        <Link 
          to="/print" 
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2 text-purple-600">Print</h2>
          <p className="text-gray-600">Print your digital addresses with QR codes</p>
        </Link>
      </div>
      
      {/* Map Section */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 mb-8">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Current Location</h2>
        </div>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <input
              id="home-location-search"
              name="homeLocationSearch"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a location..."
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search for a location on the map"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:bg-gray-400 flex items-center"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
        
        {/* Map Wrapper */}
        <div className="relative w-full" style={{ minHeight: '24rem', height: '24rem' }}>
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-90 transition-opacity duration-300">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600 font-medium">Loading map...</p>
              </div>
            </div>
          )}
          
          {/* Map Container */}
          <div 
            className={`w-full h-full transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            style={{ position: 'relative', zIndex: 0 }}
          >
            {position && MapComponent}
          </div>
        </div>
        
        {/* Location Information */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Address</h3>
              <p className="text-gray-800">{address || 'Loading...'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Coordinates</h3>
              <p className="text-gray-800 font-mono">
                {position 
                  ? `${position[0].toFixed(6)}, ${position[1].toFixed(6)}` 
                  : 'Loading...'}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">UDPIN</h3>
              <p className="text-gray-800 font-mono font-bold">
                {udpin || 'Loading...'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Get Started Section */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Get Started</h2>
        <p className="text-gray-600 mb-4">
          Use the buttons above to set your "From" and "To" addresses, or search for a location on the map.
          Your digital addresses will be saved and can be printed or shared.
        </p>
        <div className="flex gap-3">
          <Link 
            to="/from-address" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Set From Address
          </Link>
          <Link 
            to="/to-address" 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Set To Address
          </Link>
        </div>
      </div>
    </div>
  );
};

const Home = HomePage;
export default Home;
