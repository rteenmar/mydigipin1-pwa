import { useState } from 'react';
import { FaUser, FaPrint } from 'react-icons/fa';

// Mock data - in a real app, this would come from a state management solution or props
const mockFromData = {
  name: 'John Doe',
  phone: '+1 234 567 8900',
  address: '123 Main St, Anytown, AN 12345, USA',
  udpin: '1234-5678-9012-3456',
  qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=FROM:JohnDoe-1234-5678-9012-3456',
  barcode: 'https://barcode.tec-it.com/barcode.ashx?data=FROM-1234567890123456&code=Code128&dpi=96',
};

const mockToData = {
  name: 'Jane Smith',
  phone: '+1 987 654 3210',
  address: '456 Oak Ave, Somewhere, SW 67890, USA',
  udpin: '9876-5432-1098-7654',
  qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TO:JaneSmith-9876-5432-1098-7654',
  barcode: 'https://barcode.tec-it.com/barcode.ashx?data=TO-9876543210987654&code=Code128&dpi=96',
};

const PrintPage = () => {
  const [fromOptions, setFromOptions] = useState({
    name: true,
    phone: true,
    address: true,
    qrCode: true,
    barcode: true,
    udpin: true
  });

  const [toOptions, setToOptions] = useState({
    name: true,
    phone: true,
    address: true,
    qrCode: true,
    barcode: true,
    udpin: true
  });

  const handlePrint = () => {
    window.print();
  };

  const toggleFromOption = (option: string) => {
    setFromOptions(prev => ({
      ...prev,
      [option]: !prev[option as keyof typeof prev]
    }));
  };

  const toggleToOption = (option: string) => {
    setToOptions(prev => ({
      ...prev,
      [option]: !prev[option as keyof typeof prev]
    }));
  };

  return (
    <div className="print-page p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Print Options</h2>
      
      <div className="print-options grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="address-options bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
            <FaUser className="inline mr-2 text-blue-600" />
            From Address Options:
          </h3>
          <div className="space-y-3">
            {Object.entries(fromOptions).map(([key, value]) => {
              const id = `from-${key}`;
              const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
              
              return (
                <div key={id} className="flex items-center">
                  <input
                    id={id}
                    name={id}
                    type="checkbox"
                    checked={value}
                    onChange={() => toggleFromOption(key)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    aria-label={`Toggle ${label} for sender`}
                  />
                  <label htmlFor={id} className="ml-2 block text-sm text-gray-700">
                    {label}
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="address-options bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
            <FaUser className="inline mr-2 text-green-600" />
            To Address Options:
          </h3>
          <div className="space-y-3">
            {Object.entries(toOptions).map(([key, value]) => {
              const id = `to-${key}`;
              const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
              
              return (
                <div key={id} className="flex items-center">
                  <input
                    id={id}
                    name={id}
                    type="checkbox"
                    checked={value}
                    onChange={() => toggleToOption(key)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    aria-label={`Toggle ${label} for recipient`}
                  />
                  <label htmlFor={id} className="ml-2 block text-sm text-gray-700">
                    {label}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="print-preview bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
          Print Preview
        </h3>
        
        <div className="preview-content p-4 border border-gray-200 rounded-md">
          <div className="mb-6 p-4 border-b border-gray-100">
            <h4 className="text-lg font-medium text-blue-700 mb-3 flex items-center">
              <FaUser className="mr-2" /> Sender Information
            </h4>
            <div className="space-y-2">
              {fromOptions.name && (
                <p><strong className="text-gray-700">Name:</strong> <span className="ml-2">{mockFromData.name}</span></p>
              )}
              {fromOptions.phone && (
                <p><strong className="text-gray-700">Phone:</strong> <span className="ml-2">{mockFromData.phone}</span></p>
              )}
              {fromOptions.address && (
                <p><strong className="text-gray-700">Address:</strong> <span className="ml-2">{mockFromData.address}</span></p>
              )}
              {fromOptions.udpin && (
                <p><strong className="text-gray-700">UDPIN:</strong> <span className="ml-2 font-mono">{mockFromData.udpin}</span></p>
              )}
            </div>
          </div>
          
          <div className="mb-6 p-4 border-b border-gray-100">
            <h4 className="text-lg font-medium text-green-700 mb-3 flex items-center">
              <FaUser className="mr-2" /> Recipient Information
            </h4>
            <div className="space-y-2">
              {toOptions.name && (
                <p><strong className="text-gray-700">Name:</strong> <span className="ml-2">{mockToData.name}</span></p>
              )}
              {toOptions.phone && (
                <p><strong className="text-gray-700">Phone:</strong> <span className="ml-2">{mockToData.phone}</span></p>
              )}
              {toOptions.address && (
                <p><strong className="text-gray-700">Address:</strong> <span className="ml-2">{mockToData.address}</span></p>
              )}
              {toOptions.udpin && (
                <p><strong className="text-gray-700">UDPIN:</strong> <span className="ml-2 font-mono">{mockToData.udpin}</span></p>
              )}
            </div>
          </div>
          
          {(toOptions.qrCode || toOptions.barcode) && (
            <div className="flex flex-wrap gap-6 justify-center p-4">
              {toOptions.qrCode && (
                <div className="qr-code text-center">
                  <img src={mockToData.qrCode} alt="QR Code" className="w-32 h-32 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Scan for location</p>
                </div>
              )}
              {toOptions.barcode && (
                <div className="barcode text-center">
                  <img src={mockToData.barcode} alt="Barcode" className="h-16 mx-auto mb-2 w-48 object-contain" />
                  <p className="text-sm text-gray-600">Scan barcode</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="text-center">
        <button 
          onClick={handlePrint} 
          className="print-button bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center mx-auto"
          aria-label="Print shipping label"
        >
          <FaPrint className="mr-2" /> Print Shipping Label
        </button>
      </div>
    </div>
  );
};

export default PrintPage;