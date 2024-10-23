import { createRoot } from "react-dom/client"
import { useState } from "react";
import { FaCog, FaPlus, FaArrowLeft, FaCheck, FaTimes } from "react-icons/fa"
import { browser } from "webextension-polyfill-ts"
import { getPage } from "@/utils/urls"

import "../../globals.css"

export default function Popup() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [licenseStatus, setLicenseStatus] = useState<'active' | 'inactive'>('inactive')

  const handleOpenSettings = () => setIsSettingsOpen(true)
  const handleBack = () => setIsSettingsOpen(false)

  const handleOpenPage = () => {
    browser.tabs.create({
      url: browser.runtime.getURL(getPage("index.html")),
    })
  }

  const handleAddTemplate = () => {
    // Add template logic here
  }
  const handleSaveLicense = () => {
    console.log("License key saved");
    // TEST
    setLicenseStatus(prevStatus => prevStatus === 'active' ? 'inactive' : 'active')
    // Save license logic here
  }
  const handlePurchaseRedirect = () => {
    window.open("https://example.com/purchase-license", "_blank"); // Update with real purchase link
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-center text-gray-800">AffiliTap</h1>
      </div>
      <div className="p-4">
        <div className="flex flex-col items-center space-y-4">
          {isSettingsOpen ? (
            <>
              <h2 className="text-xl font-semibold text-gray-800">Enter License Key</h2>
              <div className="flex flex-col space-y-2 w-full">
                <input
                  type="text"
                  placeholder="Enter your license key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSaveLicense}
                  className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  Save
                </button>
              </div>
              <p className="text-sm text-gray-600">Don't have a license key?</p>
              <button
                onClick={handlePurchaseRedirect}
                className="w-full bg-white text-blue-500 font-semibold py-2 px-4 rounded-md border border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                Purchase a license
              </button>
              <button
                onClick={handleBack}
                className="mt-4 text-gray-600 hover:text-gray-800 focus:outline-none"
              >
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
                    <FaCheck className="mr-1 h-4 w-4" /> Active
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
                className="w-full bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center justify-center"
              >
                <FaCog className="mr-2 h-4 w-4" />
                Settings
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

createRoot(document.getElementById("root")!).render(<Popup />);
