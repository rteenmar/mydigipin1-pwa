import { memo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Import pages
import Home from './pages/Home';
import FromAddress from './pages/FromAddress';
import ToAddress from './pages/ToAddress';
import PrintPage from './pages/PrintPage';
import Navigation from './components/Navigation';

// Fix for default marker icons in Leaflet with React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Memoize the main content to prevent unnecessary re-renders
const MainContent = memo(() => (
  <main className="flex-grow bg-gray-50">
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/from-address" element={<FromAddress />} />
        <Route path="/to-address" element={<ToAddress />} />
        <Route path="/print" element={<PrintPage />} />
      </Routes>
    </div>
  </main>
));

// Memoize the footer to prevent unnecessary re-renders
const Footer = memo(() => (
  <footer className="bg-white border-t border-gray-200 py-4">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <p className="text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} MyDigiPin - Digital Address System
      </p>
    </div>
  </footer>
));

// Main App component with routing
const App = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {/* Navigation is now a subheading component */}
        <Navigation />
        
        {/* Main content area */}
        <MainContent />
        
        {/* Footer */}
        <Footer />
      </div>
    </Router>
  );
};

export default App;
