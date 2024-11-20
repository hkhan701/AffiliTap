import { createRoot } from "react-dom/client";
import { useState, useEffect } from 'react';

import { getLicenseStatus, getCurrentPlan } from "@/utils/license";
import { browserStorage } from "@/utils/browserStorage";
import { getTrackingIds } from "@/utils/utils";

import ConfirmModal from '../../components/confirmModal';
import ContentLockOverlay from "../../components/contentLockOverlay";
import Footer from "../../components/footer";
import InfoPopup from '../../components/infoPopup';
import LicenseStatusHeader from "../../components/licenseStatusHeader";
import Placeholders from "../../components/placeholders";

import {
  ChevronDown,
  FileText,
  Globe,
  Lock,
  PencilLine,
  Plus,
  Save,
  Star,
  Tag,
  Trash2,
  Type
} from 'lucide-react';
// @ts-ignore
import logo from 'src/assets/images/logo.svg'
import "../../globals.css"


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
    setIsConfirmModalOpen(false)
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
    <div className="min-h-screen flex flex-col bg-gray-100 relative">
    <div 
          className="absolute inset-0 opacity-[0.50]"
          style={{
            backgroundImage: `radial-gradient(#3B82F6 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
            filter: 'blur(1px)',
          }}
        ></div>

      {/* Header */}
      <header className="bg-blue-100 shadow-md z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="p-4 border-b border-gray-200">
              <a href="https://affilitap.vercel.app" target="_blank" rel="noopener noreferrer">
                <img src={logo} alt="logo" width={200} className="transform transition-transform duration-300 hover:scale-105" />
              </a>
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
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200">
            <div className="px-6 py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Header with Edit Icon */}
                <div className="flex items-center text-blue-800">
                  <PencilLine size={20} className="mr-2" />
                  <h2 className="text-lg font-semibold">Edit Template</h2>
                </div>

                {/* Template Selector Dropdown */}
                <div className="flex-1 min-w-0 max-w-xl relative">
                  <div className="relative">
                    <select
                      value={activeTemplateId}
                      onChange={(e) => setActiveTemplateId(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 appearance-none bg-white border border-blue-200 rounded-lg shadow-sm 
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200
                          text-gray-900 transition-all"
                      disabled={isContentLocked}
                    >
                      {templates.map(template => (
                        <option key={template.id} value={template.id} className="py-1">
                          {template?.name}
                          {template?.isDefault ? ' (Default)' : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                  </div>
                </div>

                {/* Set Default Button */}
                <button
                  onClick={handleSetDefaultTemplate}
                  disabled={isContentLocked || activeTemplate?.isDefault}
                  className={`group min-w-[160px] px-4 py-2.5 rounded-lg font-medium
                      focus:outline-none focus:ring-2 focus:ring-offset-2 
                      transition-all duration-200 flex items-center justify-center
                      ${!activeTemplate?.isDefault && !isContentLocked
                      ? 'bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500'
                      : activeTemplate?.isDefault
                        ? 'bg-amber-100 text-amber-700 cursor-default'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <Star
                    size={18}
                    className={`mr-2 ${activeTemplate?.isDefault
                      ? 'fill-amber-500'
                      : !isContentLocked
                        ? 'group-hover:fill-white transition-colors duration-200'
                        : ''
                      }`}
                  />
                  {activeTemplate?.isDefault ? 'Default Template' : 'Set as Default'}
                </button>
              </div>
            </div>
          </div>


          {/* Add New Template Header */}
          <div className="flex items-center space-x-4 pb-6 pt-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isContentLocked && handleAddTemplate()}
                  placeholder="Create New Template"
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                  disabled={isContentLocked}
                />
                <button
                  onClick={handleAddTemplate}
                  disabled={isContentLocked}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
            {isContentLocked && (
              <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md">
                <Lock size={16} className="mr-2" />
                <span className="text-sm font-medium">Template is locked</span>
              </div>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column - Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Template Name */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FileText size={16} className="mr-2" />
                  Template Name
                </label>
                <input
                  type="text"
                  value={activeTemplate.name}
                  onChange={(e) => updateActiveTemplate({ name: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 transition-all"
                  disabled={isContentLocked}
                />
              </div>

              {/* Template Content */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Type size={16} className="mr-2" />
                  Template Content
                </label>
                <textarea
                  value={activeTemplate.content}
                  onChange={(e) => updateActiveTemplate({ content: e.target.value })}
                  placeholder={defaultContent}
                  className="w-full h-80 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm disabled:bg-gray-50 transition-all resize-none"
                  disabled={isContentLocked}
                />
              </div>

              {/* Settings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tracking ID */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Globe size={16} className="mr-2" />
                    Tracking ID
                  </label>
                  <select
                    value={activeTemplate.trackingId}
                    onChange={(e) => updateActiveTemplate({ trackingId: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 bg-white transition-all"
                    disabled={isContentLocked}
                  >
                    {trackingIds.map(({ id, country }) => (
                      <option key={`${id}-${country}`} value={id}>
                        {id} ({country})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Country codes are shown next to each tracking ID</p>
                </div>

                {/* Word Limit */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Tag size={16} className="mr-2" />
                    Title Word Limit
                  </label>
                  <input
                    type="number"
                    value={activeTemplate.titleWordLimit}
                    onChange={(e) => updateActiveTemplate({ titleWordLimit: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 transition-all"
                    disabled={isContentLocked}
                  />
                  <p className="text-xs text-gray-500 mt-1">The maximum number of words in the product title</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4 pt-4">
                <button
                  onClick={handleSaveTemplate}
                  disabled={!hasChanges || isContentLocked}
                  className={`flex items-center px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${hasChanges && !isContentLocked
                    ? 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <Save size={18} className="mr-2" />
                  Save Changes
                </button>

                <button
                  onClick={() => setIsConfirmModalOpen(true)}
                  disabled={isContentLocked}
                  className="flex items-center px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <Trash2 size={18} className="mr-2" />
                  Delete Template
                </button>
              </div>
            </div>

            {/* Right Column - Placeholders */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <Placeholders isContentLocked={isContentLocked} />
              </div>
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