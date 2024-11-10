import { useState } from 'react';
import { FaKey, FaArrowLeft } from 'react-icons/fa';
import { activateLicenseKey, getLicenseStatus, getCurrentPlan } from "@/utils/license";
import { handlePurchaseRedirect, handleBillingRedirect } from "@/utils/utils";
import InfoPopup from '../popup/infoPopup';

const Settings = ({ onBack, onLicenseUpdate }) => {
    const [licenseKey, setLicenseKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [popupType, setPopupType] = useState<'success' | 'error'>('success');
    const handleClosePopup = () => setIsPopupOpen(false);

    const handleSaveLicense = async () => {
        setLoading(true);
        try {
            const result = await activateLicenseKey(licenseKey);
            if (result) {
                setPopupMessage("License activated successfully!");
                setPopupType('success');
                const [licenseStatus, currentPlan] = await Promise.all([
                    getLicenseStatus(),
                    getCurrentPlan()
                ]);
                onLicenseUpdate({ licenseStatus, currentPlan });
            } else {
                setPopupMessage("License activation failed. Please check your key.");
                setPopupType('error');
            }
        } catch (error) {
            setPopupMessage("There was an error activating the license. Please try again.");
            setPopupType('error');
        }
        setIsPopupOpen(true);
        setLoading(false);
    };

    return (
        <>
            <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg">
                {/* Header */}
                <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold">
                        <FaKey className="inline-block mr-2" />
                        Enter License Key
                    </h2>
                </div>

                <div className="p-6 space-y-4">
                    <input
                        type="text"
                        value={licenseKey}
                        onChange={(e) => setLicenseKey(e.target.value)}
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                        onClick={handleSaveLicense}
                        disabled={loading}
                        className="w-full px-4 py-2 text-white font-semibold bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Activating..." : "Activate License"}
                    </button>

                    <button
                        onClick={handleBillingRedirect}
                        className="w-full px-4 py-2 text-blue-500 bg-white border border-blue-500 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Manage Subscription
                    </button>
                </div>

                <div className="p-6 border-t text-center space-y-4">
                    <p className="text-sm text-gray-600">
                        Don't have a license key?
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={handlePurchaseRedirect}
                            className="px-4 py-2 font-semibold text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Purchase a license
                        </button>
                        <button
                            onClick={onBack}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <FaArrowLeft className="inline-block mr-2 h-4 w-4" />
                            Back
                        </button>
                    </div>
                </div>

                {/* License Error/Success Popup */}
                <InfoPopup
                    isOpen={isPopupOpen}
                    message={popupMessage}
                    type={popupType}
                    onClose={handleClosePopup}
                />
            </div>
        </>
    );
};

export default Settings;