import React, { useState, useEffect, useCallback } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { generateUDPIN, formatUDPIN } from '../lib/udpin';
import { reverseGeocode } from '../lib/geocoding';
import MapComponent from '../components/MapComponent'; // Import the new MapComponent

const HomePage = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState('');
  const [udpin, setUdpin] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const initialMapCenter: [number, number] = [20.5937, 78.9629]; // Default to India

  // Update location data function
  const updateLocationData = useCallback(async (pos: [number, number]) => {
    try {
      // Ensure lat and lng are numbers before passing to generateUDPIN and reverseGeocode
      const lat = pos[0];
      const lng = pos[1];

      if (isNaN(lat) || isNaN(lng)) {
        console.error('Invalid coordinates passed to updateLocationData:', pos);
        setAddress('Invalid coordinates');
        setUdpin('N/A');
        return 'Invalid coordinates';
      }

      const [newUdpin, addr] = await Promise.all([
        formatUDPIN(generateUDPIN(lat, lng)),
        reverseGeocode(lat, lng).catch(() => 'Address not available')
      ]);

      setUdpin(newUdpin);
      setAddress(addr);

      return addr;
    } catch (error) {
      console.error('Error updating location data:', error);
      setAddress('Address not available');
      return 'Address not available';
    } finally {
      setIsLoading(false); // Set loading to false after data is fetched
    }
  }, []);

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
            const geoPos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
              });
            });

            if (!isMounted) return;

            // Explicitly check for NaN here
            if (isNaN(geoPos.coords.latitude) || isNaN(geoPos.coords.longitude)) {
              console.warn('Geolocation returned NaN coordinates, falling back to default.');
              newPosition = initialMapCenter;
            } else {
              newPosition = [geoPos.coords.latitude, geoPos.coords.longitude];
            }

          } catch (error) {
            console.log('Using default position due to geolocation error:', error);
            if (!isMounted) return;
            newPosition = initialMapCenter; // Use default if geolocation fails
          }
        } else {
          newPosition = initialMapCenter; // Default to India
        }

        if (!isMounted) return;

        // Set position first, then update data
        setPosition(newPosition);
        await updateLocationData(newPosition);

      } catch (error) {
        console.error('Error initializing map:', error);
        if (!isMounted) return;

        setPosition(initialMapCenter); // Fallback position
        await updateLocationData(initialMapCenter);
      }
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, [updateLocationData]);


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
          <MapComponent center={position || initialMapCenter} isLoading={isLoading}>
            {position && (
              <Marker
                position={position}
              >
                <Popup>Your location: {address || 'Unknown address'}</Popup>
              </Marker>
            )}
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