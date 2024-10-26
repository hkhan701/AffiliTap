import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { FaCog, FaPlus, FaArrowLeft, FaCheck, FaTimes } from "react-icons/fa";
import { browser } from "webextension-polyfill-ts";
import { getPage } from "@/utils/urls";
import { activateLicenseKey, getLicenseStatus, getCurrentPlan } from "@/utils/license";
import { browserStorage } from "@/utils/browserStorage";
import InfoPopup from './infoPopup';
import logo from 'src/assets/images/logo.svg';

import "../../globals.css";

export default function Popup() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');

  const handleOpenSettings = () => setIsSettingsOpen(true);
  const handleBack = () => setIsSettingsOpen(false);
  const handleClosePopup = () => setIsPopupOpen(false);

  const handleOpenPage = () => {
    browser.tabs.create({
      url: browser.runtime.getURL(getPage("index.html")),
    });
  };

  const handleSaveLicense = async () => {
    setLoading(true);
    try {
      const result = await activateLicenseKey(licenseKey);
      if (result) {
        setPopupMessage("License activated successfully!");
        setPopupType('success');
        const status = await getLicenseStatus();
        const plan = await getCurrentPlan();
        setLicenseStatus(status);
        setCurrentPlan(plan);
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

  const handlePurchaseRedirect = () => {
    window.open("https://affilitap.lemonsqueezy.com/checkout", "_blank"); // Update with real purchase link
  }


  const handleAddTemplate = () => {
    // Add template logic here
    console.log("Add template clicked");
    handleOpenPage();
    // get current lciense
    const currentLicense = browserStorage.get("licenseData");
    console.log(currentLicense);
  }

  useEffect(() => {
    const fetchLicenseStatus = async () => {
      const status = await getLicenseStatus();
      setLicenseStatus(status);

      const plan = await getCurrentPlan();
      setCurrentPlan(plan);
    };

    fetchLicenseStatus();
  }, []);

  return (
    <div className="bg-blue-100 h-full">
      <div className="p-4 border-b border-gray-200">
        <img src={logo} alt="logo" width={200} />
      </div>
      <div className="p-4">
        <div className="flex flex-col items-center space-y-8">
          {isSettingsOpen ? (
            <>
              <h2 className="text-xl font-semibold text-gray-800">Enter License Key</h2>
              <div className="flex flex-col space-y-2 w-full">
                <input
                  type="text"
                  placeholder="Enter your license key"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSaveLicense}
                  className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  disabled={loading}
                >
                  {loading ? "Activating..." : "Save"}
                </button>
              </div>
              <p className="text-sm text-gray-600">Don't have a license key?</p>
              <button
                onClick={handlePurchaseRedirect}
                className="w-full bg-white text-blue-500 font-semibold py-2 px-4 rounded-md border border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                Purchase a license
              </button>
              <button onClick={handleBack} className="mt-4 text-gray-600 hover:text-gray-800">
                <FaArrowLeft className="inline-block mr-2 h-4 w-4" />
                Back
              </button>
            </>
          ) : (
            <>
              <div className="w-full mb-4 p-2 rounded-md bg-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">License Status:</span>
                {licenseStatus === 'active' ? (
                  <span className="text-green-500 flex items-center">
                    <FaCheck className="mr-1 h-4 w-4" /> Active (Plan: {currentPlan})
                  </span>
                ) : (
                  <span className="text-red-500 flex items-center">
                    <FaTimes className="mr-1 h-4 w-4" /> Inactive
                  </span>
                )}
              </div>
              <button
                onClick={handleAddTemplate}
                className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center justify-center"
              >
                <FaPlus className="mr-2 h-4 w-4" />
                Add Template
              </button>
              <button
                onClick={handleOpenSettings}
                className="border-solid border-2 border-black w-full bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center justify-center"
              >
                <FaCog className="mr-2 h-4 w-4" />
                Settings
              </button>
            </>
          )}
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
  );
}

createRoot(document.getElementById("root")!).render(<Popup />);
