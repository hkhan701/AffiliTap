import { createRoot } from "react-dom/client"
import { useState, useEffect } from 'react'
import { FaPlus, FaTrash, FaSave, FaStar } from 'react-icons/fa'
import { getLicenseStatus, getCurrentPlan } from "@/utils/license"
import { browserStorage } from "@/utils/browserStorage"
import Footer from "./footer"
import ContentLockOverlay from "./contentLockOverlay"
import LicenseStatusHeader from "./licenseStatusHeader"
import Placeholders from "./placeholders"
import InfoPopup from '../popup/infoPopup'
import ConfirmModal from './confirmModal'
// @ts-ignore
import logo from 'src/assets/images/logo.svg'
import "../../globals.css"
import { getTrackingIds } from "@/utils/utils"

export default function Page() {
  const [trackingIds, setTrackingIds] = useState([])
  const defaultContent = '🎉 Limited Time Offer! 🎉\n{product_name}\n\n{discount_percentage} OFF!\nSave an extra ${coupon_$} with clip on coupon\n#ad\n{amz_link}'
  const defaultTemplate = {
    id: "default",
    name: 'Default Template',
    content: defaultContent,
    titleWordLimit: 10,
    trackingId: trackingIds[0]?.id || '',
    isDefault: true
  }

  const [templates, setTemplates] = useState([defaultTemplate])
  const [activeTemplateId, setActiveTemplateId] = useState(defaultTemplate.id)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [licenseStatus, setLicenseStatus] = useState("")
  const [currentPlan, setCurrentPlan] = useState(null)

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [popupMessage, setPopupMessage] = useState("")
  const [popupType, setPopupType] = useState<'success' | 'error'>('success')
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const isContentLocked = licenseStatus !== 'active'
  const activeTemplate = templates.find(t => t.id === activeTemplateId) || defaultTemplate

  const handleClosePopup = () => setIsPopupOpen(false)

  const handleAddTemplate = () => {
    if (currentPlan === "Basic Plan" && templates.length >= 5) {
      setPopupMessage("You can only add up to 5 templates on the Basic plan. Upgrade to the Pro plan to UNLIMITED templates.");
      setPopupType("error");
      setIsPopupOpen(true);
      return;
    }
    if (newTemplateName.trim()) {
      const id = Date.now().toString(36) + Math.random().toString(36).substring(2)
      const newTemplate = {
        id,
        name: newTemplateName,
        content: '',
        titleWordLimit: 10,
        trackingId: trackingIds[0]?.id || '',
        isDefault: false
      }
      setTemplates([...templates, newTemplate])
      setActiveTemplateId(newTemplate.id)
      setNewTemplateName('')
      setHasChanges(true)
    }
  }

  const handleConfirmDeleteTemplate = () => {
    const updatedTemplates = templates.filter(template => template.id !== activeTemplateId)
    if (updatedTemplates.length === 0) {
      setPopupMessage("Cannot delete the last template")
      setPopupType('error')
      setIsPopupOpen(true)
      return
    }

    // If deleting the default template, set the first remaining template as default
    if (activeTemplate.isDefault && updatedTemplates.length > 0) {
      updatedTemplates[0].isDefault = true
    }

    try {
      browserStorage.set('templates', JSON.stringify(updatedTemplates))
      setTemplates(updatedTemplates)
      setActiveTemplateId(updatedTemplates[0].id)
    } catch {
      setPopupMessage("Error deleting templates")
      setPopupType('error')
    }
    setIsConfirmModalOpen(false);
  }

  const handleSaveTemplate = () => {
    const updatedTemplates = templates.map(template =>
      template.id === activeTemplateId ? activeTemplate : template
    )

    try {
      browserStorage.set('templates', JSON.stringify(updatedTemplates))
      setTemplates(updatedTemplates)
      setPopupMessage("Template saved successfully")
      setPopupType('success')
      setHasChanges(false)
    } catch {
      setPopupMessage("Error saving templates")
      setPopupType('error')
    }
    setIsPopupOpen(true)
  }

  const updateActiveTemplate = (updates) => {
    setTemplates(templates.map(template =>
      template.id === activeTemplateId
        ? { ...template, ...updates }
        : template
    ))
    setHasChanges(true)
  }

  const fetchTemplates = async () => {
    const storedTemplates = await browserStorage.get('templates')
    if (storedTemplates) {
      const templatesData = JSON.parse(storedTemplates)
      setTemplates(templatesData)
      const defaultTemplate = templatesData.find(t => t?.isDefault) || templatesData[0]
      if (defaultTemplate) {
        setActiveTemplateId(defaultTemplate.id)
      }
    }
  }

  const handleSetDefaultTemplate = () => {
    const updatedTemplates = templates.map(template => ({
      ...template,
      isDefault: template.id === activeTemplateId
    }))

    try {
      browserStorage.set('templates', JSON.stringify(updatedTemplates))
      setTemplates(updatedTemplates)
      setPopupMessage("Default template updated successfully")
      setPopupType('success')
      setIsPopupOpen(true)
    } catch {
      setPopupMessage("Error updating default template")
      setPopupType('error')
      setIsPopupOpen(true)
    }
  }

  const fetchLicenseStatus = async () => {
    const [licenseStatus, currentPlan] = await Promise.all([getLicenseStatus(), getCurrentPlan()]);
    setLicenseStatus(licenseStatus);
    setCurrentPlan(currentPlan);
  };

  useEffect(() => {
    fetchLicenseStatus()
    fetchTemplates()
    getTrackingIds().then((ids) => setTrackingIds(ids));
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      {/* Header */}
      <header className="bg-blue-100 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="p-4 border-b border-gray-200">
              <img src={logo} alt="logo" width={200} />
            </div>
          </div>
          <div className="flex items-center">
            <LicenseStatusHeader />
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">

        <div className="relative bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ContentLockOverlay isContentLocked={isContentLocked} />

          {/* Edit Template Header */}
          <div className="border-b bg-blue-100 px-6 py-4 rounded-lg">
            <div className="flex items-center justify-start gap-3">
              <h2 className="text-lg font-medium">Edit Template:</h2>
              <div className="flex gap-2">
                <div className="flex-1 max-w-md">
                  <select
                    value={activeTemplateId}
                    onChange={(e) => setActiveTemplateId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                    disabled={isContentLocked}
                  >
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template?.name} {template?.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleSetDefaultTemplate}
                disabled={isContentLocked || activeTemplate?.isDefault}
                className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center ${!activeTemplate?.isDefault && !isContentLocked
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                <FaStar className="mr-2" /> {activeTemplate?.isDefault ? 'Default Template' : 'Set as Default'}
              </button>
            </div>
          </div>

          <div className="space-y-6">

            <div className="flex items-center justify-between pt-4">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isContentLocked && handleAddTemplate()}
                  placeholder="Enter Template Name"
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  disabled={isContentLocked}
                />
                <button
                  onClick={handleAddTemplate}
                  className="ml-2 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={isContentLocked}
                >
                  <FaPlus />
                </button>
              </div>
            </div>

            <div className="space-y-4">

              {/* Content */}
              <div className="grid grid-cols-12 gap-6">
                {/* Left Column */}
                <div className="col-span-8 space-y-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={activeTemplate.name}
                      onChange={(e) => updateActiveTemplate({ name: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      disabled={isContentLocked}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Content
                    </label>
                    <textarea
                      value={activeTemplate.content}
                      onChange={(e) => updateActiveTemplate({ content: e.target.value })}
                      placeholder={defaultContent}
                      className="w-full h-64 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono disabled:bg-gray-100 disabled:text-gray-500"
                      disabled={isContentLocked}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tracking ID
                      </label>
                      <select
                        value={activeTemplate.trackingId}
                        onChange={(e) => updateActiveTemplate({ trackingId: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                        disabled={isContentLocked}
                      >

                        {/* Map over trackingIds with country labels */}
                        {trackingIds.map(({ id, country }) => (
                          <option key={`${id}-${country}`} value={id}>
                            {id} ({country})
                          </option>
                        ))}
                      </select>
                      <p className="text-sm text-gray-500 mt-1">The country associated is listed beside the tracking ID for reference.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title Word Limit
                      </label>
                      <input
                        type="number"
                        value={activeTemplate.titleWordLimit}
                        onChange={(e) => updateActiveTemplate({ titleWordLimit: parseInt(e.target.value, 10) || 0 })}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        disabled={isContentLocked}
                      />
                    </div>
                  </div>

                </div>

                {/* Right Column */}
                <div className="col-span-4 justify-end">
                  <Placeholders isContentLocked={isContentLocked} />
                </div>

              </div>

            </div>

            <div className="flex justify-start space-x-3">
              <button
                onClick={handleSaveTemplate}
                disabled={!hasChanges || isContentLocked}
                className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center ${hasChanges && !isContentLocked
                  ? 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                <FaSave className="mr-2" /> Save
              </button>
              <button
                onClick={() => setIsConfirmModalOpen(true)}
                disabled={isContentLocked}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <FaTrash className="mr-2" /> Delete
              </button>
            </div>
          </div>
        </div>
      </main>

      <InfoPopup
        isOpen={isPopupOpen}
        message={popupMessage}
        type={popupType}
        onClose={handleClosePopup}
      />
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Confirm Deletion"
        message="Are you sure you want to delete this template?"
        onConfirm={handleConfirmDeleteTemplate}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
      <Footer />
    </div>
  )
}

createRoot(document.getElementById("root")!).render(<Page />)