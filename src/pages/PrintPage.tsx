import { useState, useEffect } from 'react';
import { FaUser, FaPrint } from 'react-icons/fa';
import { loadFromAddressData, loadToAddressData, type FromToLocationData } from '../lib/appStorage';

const PrintPage = () => {
  const [fromData, setFromData] = useState<FromToLocationData | null>(null);
  const [toData, setToData] = useState<FromToLocationData | null>(null);

  const [fromOptions, setFromOptions] = useState({
    name: true,
    phone: true,
    address: true,
    udpin: true,
    qrCode: true,
    barcode: true,
  });

  const [toOptions, setToOptions] = useState({
    name: true,
    phone: true,
    address: true,
    udpin: true,
    qrCode: true,
    barcode: true,
  });

  useEffect(() => {
    setFromData(loadFromAddressData());
    setToData(loadToAddressData());
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const toggleFromOption = (option: keyof typeof fromOptions) => {
    setFromOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const toggleToOption = (option: keyof typeof toOptions) => {
    setToOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Function to generate QR code URL
  const generateQrCodeUrl = (data: FromToLocationData | null, prefix: string) => {
    if (!data || !data.udpin) return '';
    const qrData = `${prefix}:${data.name || ''}-${data.udpin}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
  };

  // Function to generate Barcode URL
  const generateBarcodeUrl = (data: FromToLocationData | null, prefix: string) => {
    if (!data || !data.udpin) return '';
    const barcodeData = `${prefix}-${data.udpin.replace(/-/g, '')}`; // Remove hyphens for barcode
    return `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(barcodeData)}&code=Code128&dpi=96`;
  };

  return (
    <div className="print-page p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 print-hidden">Print Options</h2>
      
      <div className="print-options grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 print-hidden">
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
                    onChange={() => toggleFromOption(key as keyof typeof fromOptions)}
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
                    onChange={() => toggleToOption(key as keyof typeof toOptions)}
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
        <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 print-hidden">
          Print Preview
        </h3>
        
        <div className="preview-content p-4 border border-gray-200 rounded-md print-layout">
          {/* From Address Slip */}
          <div className="address-slip from-address-slip mb-6">
            {fromData ? (
              <div className="flex w-full h-full">
                <div className="flex-shrink-0 flex flex-col items-center justify-center pr-2">
                  {fromOptions.qrCode && (
                    <div className="qr-code text-center mb-1">
                      <img src={generateQrCodeUrl(fromData, 'FROM')} alt="From QR Code" className="w-20 h-20 mx-auto" />
                      <p className="text-xs text-gray-600">Scan for location</p>
                    </div>
                  )}
                  {fromOptions.barcode && (
                    <div className="barcode text-center">
                      <img src={generateBarcodeUrl(fromData, 'FROM')} alt="From Barcode" className="h-10 mx-auto w-28 object-contain" />
                      <p className="text-xs text-gray-600">Scan barcode</p>
                    </div>
                  )}
                </div>
                <div className="flex-grow space-y-0.5 text-xs">
                  {fromOptions.name && (
                    <p><strong className="text-gray-700">Name:</strong> <span className="ml-1">{fromData.name}</span></p>
                  )}
                  {fromOptions.phone && (
                    <p><strong className="text-gray-700">Phone:</strong> <span className="ml-1">{fromData.phone}</span></p>
                  )}
                  {fromOptions.address && (
                    <p><strong className="text-gray-700">Address:</strong> <span className="ml-1">{fromData.address}</span></p>
                  )}
                  {fromOptions.udpin && (
                    <p><strong className="text-gray-700">UDPIN:</strong> <span className="ml-1 font-mono">{fromData.udpin}</span></p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No From Address data available. Please set it on the 'From Address' page.</p>
            )}
          </div>
          
          {/* To Address Slip */}
          <div className="address-slip to-address-slip">
            {toData ? (
              <div className="flex w-full h-full">
                <div className="flex-shrink-0 flex flex-col items-center justify-center pr-2">
                  {toOptions.qrCode && (
                    <div className="qr-code text-center mb-1">
                      <img src={generateQrCodeUrl(toData, 'TO')} alt="To QR Code" className="w-20 h-20 mx-auto" />
                      <p className="text-xs text-gray-600">Scan for location</p>
                    </div>
                  )}
                  {toOptions.barcode && (
                    <div className="barcode text-center">
                      <img src={generateBarcodeUrl(toData, 'TO')} alt="To Barcode" className="h-10 mx-auto w-28 object-contain" />
                      <p className="text-xs text-gray-600">Scan barcode</p>
                    </div>
                  )}
                </div>
                <div className="flex-grow space-y-0.5 text-xs">
                  {toOptions.name && (
                    <p><strong className="text-gray-700">Name:</strong> <span className="ml-1">{toData.name}</span></p>
                  )}
                  {toOptions.phone && (
                    <p><strong className="text-gray-700">Phone:</strong> <span className="ml-1">{toData.phone}</span></p>
                  )}
                  {toOptions.address && (
                    <p><strong className="text-gray-700">Address:</strong> <span className="ml-1">{toData.address}</span></p>
                  )}
                  {toOptions.udpin && (
                    <p><strong className="text-gray-700">UDPIN:</strong> <span className="ml-1 font-mono">{toData.udpin}</span></p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No To Address data available. Please set it on the 'To Address' page.</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-center print-hidden">
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