import { createRoot } from "react-dom/client"
import { useState, useEffect } from 'react'
import { FaPlus, FaTrash, FaSave, FaLock } from 'react-icons/fa'
import { getLicenseStatus, getCurrentPlan } from "@/utils/license"
import { handlePurchaseRedirect } from "@/utils/utils"
import { browserStorage } from "@/utils/browserStorage"
import Footer from "./footer"
import LicenseStatusHeader from "./licenseStatusHeader"
import Placeholders from "./placeholders"
import InfoPopup from '../popup/infoPopup'
// @ts-ignore
import logo from 'src/assets/images/logo.svg'
import "../../globals.css"

export default function Page() {
  const defaultContent = '🎉 Limited Time Offer! 🎉\n{product_name}\n\n{discount_percentage} OFF!\nSave an extra ${coupon_$} with clip on coupon\n#ad\n{amz_link}'
  const defaultTemplate = {
    id: "default",
    name: 'Default Template',
    content: defaultContent,
    titleWordLimit: 10
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

  const isContentLocked = licenseStatus !== 'active'
  const activeTemplate = templates.find(t => t.id === activeTemplateId) || defaultTemplate

  const handleClosePopup = () => setIsPopupOpen(false)

  const handleAddTemplate = () => {
    if (newTemplateName.trim()) {
      const id = Date.now().toString(36) + Math.random().toString(36).substring(2)
      const newTemplate = {
        id,
        name: newTemplateName,
        content: '',
        titleWordLimit: 10
      }
      setTemplates([...templates, newTemplate])
      setActiveTemplateId(newTemplate.id)
      setNewTemplateName('')
      setHasChanges(true)
    }
  }

  const handleDeleteTemplate = (id) => {
    const updatedTemplates = templates.filter(template => template.id !== id)
    if (updatedTemplates.length === 0) {
      setPopupMessage("Cannot delete the last template")
      setPopupType('error')
      setIsPopupOpen(true)
      return
    }
    
    try {
      browserStorage.set('templates', JSON.stringify(updatedTemplates))
      setTemplates(updatedTemplates)
      if (activeTemplateId === id) {
        setActiveTemplateId(updatedTemplates[0].id)
      }
      setPopupMessage("Template deleted successfully")
      setPopupType('success')
      setHasChanges(true)
    } catch {
      setPopupMessage("Error deleting templates")
      setPopupType('error')
    }
    setIsPopupOpen(true)
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
      if (templatesData.length > 0) {
        setActiveTemplateId(templatesData[0].id)
      }
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
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
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
          {isContentLocked && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="text-center p-6 bg-white/80 rounded-lg shadow-lg max-w-md">
                <FaLock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Feature Restricted
                </h3>
                <p className="text-gray-600 mb-4">
                  You need an active license to use this feature.
                </p>
                <button
                  className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  onClick={handlePurchaseRedirect}
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-md">
                <select
                  value={activeTemplateId}
                  onChange={(e) => setActiveTemplateId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                  disabled={isContentLocked}
                >
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center ml-4">
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

              <div className="flex gap-6">
                <div className="flex-1">
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
                <Placeholders isContentLocked={isContentLocked} />
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
                onClick={() => handleDeleteTemplate(activeTemplateId)}
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
      <Footer />
    </div>
  )
}

createRoot(document.getElementById("root")!).render(<Page />)