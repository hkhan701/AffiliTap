import React from 'react';

interface LicensePopupProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
}

const LicensePopup: React.FC<LicensePopupProps> = ({ message, isOpen, onClose, type }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 shadow-lg w-96">
        <h2 className={`text-xl font-semibold mb-4 ${type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {type === 'success' ? 'Success!' : 'Error!'}
        </h2>
        <p className="text-gray-800 mb-4">{message}</p>
        <button
          onClick={onClose}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default LicensePopup;
