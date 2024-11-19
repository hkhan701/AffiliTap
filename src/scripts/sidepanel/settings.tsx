import { useState } from 'react';
import { 
  KeyRound, 
  Loader2, 
  CreditCard, 
  ShoppingCart
} from 'lucide-react';
import { activateLicenseKey, getLicenseStatus, getCurrentPlan } from "@/utils/license";
import { handlePurchaseRedirect, handleBillingRedirect } from "@/utils/utils";
import InfoPopup from '../../components/infoPopup';

interface SettingsProps {
  onLicenseUpdate: (data: { licenseStatus: string; currentPlan: string }) => void;
}

export default function Settings({ onLicenseUpdate }: SettingsProps) {
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({
    isOpen: false,
    message: "",
    type: 'success' as 'success' | 'error' | 'warning'
  });

  const handleSaveLicense = async () => {
    setLoading(true);
    try {
      const result = await activateLicenseKey(licenseKey);
      if (result) {
        const [licenseStatus, currentPlan] = await Promise.all([
          getLicenseStatus(),
          getCurrentPlan()
        ]);
        onLicenseUpdate({ licenseStatus, currentPlan });
        setPopup({
          isOpen: true,
          message: "License activated successfully!",
          type: 'success'
        });
        setLicenseKey("");
      } else {
        setPopup({
          isOpen: true,
          message: "License activation failed. Please check your key.",
          type: 'error'
        });
      }
    } catch (error) {
      setPopup({
        isOpen: true,
        message: "There was an error activating the license. Please try again.",
        type: 'error'
      });
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <KeyRound className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-800">License Management</h2>
          </div>
        </div>

        {/* License Key Input Section */}
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label htmlFor="licenseKey" className="block text-sm font-medium text-gray-700">
              License Key
            </label>
            <input
              id="licenseKey"
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            />
          </div>

          <button
            onClick={handleSaveLicense}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Activating...</span>
              </>
            ) : (
              <>
                <KeyRound className="h-5 w-5" />
                <span>Activate License</span>
              </>
            )}
          </button>

          <button
            onClick={handleBillingRedirect}
            className="w-full px-4 py-3 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <CreditCard className="h-5 w-5" />
            <span>Manage Subscription</span>
          </button>
        </div>

        {/* Purchase Section */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Don't have a license key yet?
            </p>
            <button
              onClick={handlePurchaseRedirect}
              className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Purchase a License</span>
            </button>
          </div>
        </div>
      </div>

      <InfoPopup
        isOpen={popup.isOpen}
        message={popup.message}
        type={popup.type}
        onClose={() => setPopup(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}