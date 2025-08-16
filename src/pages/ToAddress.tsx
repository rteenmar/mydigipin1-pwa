import React, { useState, useEffect, useCallback } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { generateUDPIN, decodeUDPIN, formatUDPIN, isValidUDPIN } from '../lib/udpin';
import { reverseGeocode } from '../lib/geocoding';
import { saveToAddressData, loadToAddressData } from '../lib/appStorage';
import MapComponent from '../components/MapComponent'; // Import the new MapComponent

const ToAddress = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState('');
  const [locationName, setLocationName] = useState('');
  const [udpin, setUdpin] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const initialMapCenter: [number, number] = [20.5937, 78.9629]; // Default to India

  const updateLocationData = useCallback(async (lat: number, lng: number) => {
    try {
      setIsLoading(true);
      // Add explicit NaN check here too, just in case
      if (isNaN(lat) || isNaN(lng)) {
        console.error('Invalid coordinates passed to updateLocationData:', lat, lng);
        setUdpin('N/A');
        setAddress('Invalid coordinates');
        setPosition(null); // Or set to a default valid position if preferred
        return; // Exit early
      }
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
          setLocationName(savedData.address);
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
        const parsedLat = parseFloat(lat);
        const parsedLon = parseFloat(lon);

        if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
          await updateLocationData(parsedLat, parsedLon);
        } else {
          alert('Received invalid coordinates from search. Please try a different search term.');
        }
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
    <div className="flex flex-col h-screen">
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">To Address</h1>
      </div>

      <div className="flex-1 flex flex-col">
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

        <MapComponent center={position || initialMapCenter} isLoading={isLoading} zoom={13}>
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
        </MapComponent>

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