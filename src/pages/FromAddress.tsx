import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { generateUDPIN, formatUDPIN } from '../lib/udpin';
import { reverseGeocode } from '../lib/geocoding';
import { saveFromAddressData, loadFromAddressData } from '../lib/appStorage';
import MapComponent from '../components/MapComponent'; // Import the new MapComponent

// Define props for LocationMarker component
interface LocationMarkerProps {
  position: [number, number] | null;
  onPositionChange: (lat: number, lng: number) => Promise<void>;
}

// Interactive marker component
const LocationMarker: React.FC<LocationMarkerProps> = ({ position, onPositionChange }) => {
  const map = useMap();
  const markerRef = useRef<L.Marker>(null);

  // Update local position when prop changes and fly to it
  useEffect(() => {
    if (position) {
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

  if (!position) return null;

  return (
    <Marker
      draggable={true}
      eventHandlers={{
        dragend: handleDragEnd,
      }}
      position={position}
      ref={markerRef}
    >
      <Popup minWidth={200}>
        <div>
          <p>Drag me or click on the map to move</p>
          <p>Lat: {position[0].toFixed(6)}</p>
          <p>Lng: {position[1].toFixed(6)}</p>
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
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const initialMapCenter: [number, number] = [20.5937, 78.9629]; // Default to India

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
      setPosition([lat, lng]);

    } catch (error) {
      console.error('Error updating location:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize with default position or loaded data
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const initPosition = async () => {
      try {
        setIsLoading(true);
        let newPosition: [number, number];
        const savedData = loadFromAddressData();

        if (savedData) {
          newPosition = [savedData.lat, savedData.lng];
          setName(savedData.name);
          setPhone(savedData.phone);
          setLocationName(savedData.address);
          setUdpin(savedData.udpin);
          setAddress(savedData.address);
        } else if (navigator.geolocation) {
          try {
            const geoPos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
              });
            });
            if (!isMounted) return; // Check if component is still mounted
            newPosition = [geoPos.coords.latitude, geoPos.coords.longitude];
          } catch (error) {
            console.log('Using default position due to geolocation error:', error);
            if (!isMounted) return; // Check if component is still mounted
            newPosition = initialMapCenter; // Use default if geolocation fails
          }
        } else {
          newPosition = initialMapCenter; // Default to India
        }

        if (!isMounted) return; // Check if component is still mounted

        setPosition(newPosition);
        // Only update location data if it wasn't loaded from storage
        if (!savedData) {
          await updateLocationData(newPosition[0], newPosition[1]);
        } else {
          setIsLoading(false); // If loaded from storage, stop loading
        }

      } catch (error) {
        console.error('Error getting location, defaulting to India:', error);
        if (!isMounted) return; // Check if component is still mounted
        setPosition(initialMapCenter);
        await updateLocationData(initialMapCenter[0], initialMapCenter[1]);
      }
    };

    initPosition();

    return () => {
      isMounted = false; // Cleanup: set flag to false when component unmounts
    };
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
    if (position) {
      saveFromAddressData({
        name,
        phone,
        address,
        udpin,
        lat: position[0],
        lng: position[1],
      });
      alert('From Address saved successfully!');
    } else {
      alert('Cannot save: location not set.');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">From Address</h1>
      </div>

      <div className="flex-1 flex flex-col">
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

        <MapComponent center={position || initialMapCenter} isLoading={isLoading}>
          {position && (
            <LocationMarker
              position={position}
              onPositionChange={updateLocationData}
            />
          )}
        </MapComponent>

        <div className="p-4 border-t">
          <div className="mb-4">
            <label htmlFor="from-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              id="from-name"
              name="fromName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Your name"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="from-phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone no
            </label>
            <input
              id="from-phone"
              name="fromPhone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Your phone number"
            />
          </div>

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