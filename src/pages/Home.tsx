import React, { useState, useEffect, useCallback } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { generateUDPIN, formatUDPIN } from '../lib/udpin';
import { reverseGeocode } from '../lib/geocoding';
import MapComponent from '../components/MapComponent'; // Import the new MapComponent

const HomePage = () => {
  const initialMapCenter: [number, number] = [20.5937, 78.9629]; // Default to India
  const [position, setPosition] = useState<[number, number]>(initialMapCenter); // Initialize with default
  const [address, setAddress] = useState('');
  const [udpin, setUdpin] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Function to update location data, ensuring coordinates are valid
  const updateLocationData = useCallback(async (inputLat: number, inputLng: number) => {
    let newPosition: [number, number] = initialMapCenter; // Default fallback
    let newAddress = 'Address not available';
    let newUdpin = 'N/A';

    try {
      if (isNaN(inputLat) || isNaN(inputLng)) { // Check here
        console.error('Invalid coordinates provided to updateLocationData:', inputLat, inputLng);
        // newPosition, newAddress, newUdpin remain as initial/default
      } else {
        const [udpinResult, addressResult] = await Promise.all([
          formatUDPIN(generateUDPIN(inputLat, inputLng)),
          reverseGeocode(inputLat, inputLng).catch(() => 'Address not available')
        ]);

        newPosition = [inputLat, inputLng];
        newUdpin = udpinResult;
        newAddress = addressResult;
      }
    } catch (error) {
      console.error('Error in updateLocationData processing:', error);
      // newPosition, newAddress, newUdpin remain as initial/default
    } finally {
      // Final check before setting state to ensure no NaN values
      if (isNaN(newPosition[0]) || isNaN(newPosition[1])) {
        console.error('Attempted to set NaN position, falling back to initialMapCenter.');
        setPosition(initialMapCenter); // Force valid coordinates
      } else {
        setPosition(newPosition);
      }
      setAddress(newAddress);
      setUdpin(newUdpin);
      setIsLoading(false);
    }
  }, [initialMapCenter]);

  // Initialize map position and data
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      setIsLoading(true); // Start loading immediately

      let currentLat = initialMapCenter[0];
      let currentLng = initialMapCenter[1];

      if (navigator.geolocation) {
        try {
          const geoPos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            });
          });

          if (isMounted && !isNaN(geoPos.coords.latitude) && !isNaN(geoPos.coords.longitude)) {
            currentLat = geoPos.coords.latitude;
            currentLng = geoPos.coords.longitude;
          } else if (isMounted) {
            console.warn('Geolocation returned NaN coordinates or component unmounted, falling back to default.');
          }
        } catch (error) {
          if (isMounted) {
            console.log('Using default position due to geolocation error:', error);
          }
        }
      }

      if (!isMounted) return;

      await updateLocationData(currentLat, currentLng);
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, [updateLocationData, initialMapCenter]);


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true); // Start loading immediately

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch location');
      }

      const data = await response.json();

      let targetLat = initialMapCenter[0];
      let targetLng = initialMapCenter[1];
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const parsedLat = parseFloat(lat);
        const parsedLon = parseFloat(lon);

        if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
          targetLat = parsedLat;
          targetLng = parsedLon;
        } else {
          alert('Received invalid coordinates from search. Please try a different search term.');
        }
      } else {
        alert('No results found. Please try a different search term.');
      }

      await updateLocationData(targetLat, targetLng);

    } catch (error) {
      console.error('Error searching location:', error);
      alert('Failed to find location. Please try again.');
      // Fallback handled by updateLocationData
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
          <MapComponent center={position} isLoading={isLoading}>
            <Marker
              position={position}
            >
              <Popup>Your location: {address || 'Unknown address'}</Popup>
            </Marker>
          </MapComponent>
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