import { createRoot } from "react-dom/client";
import { useState, useEffect } from 'react';

import { browserStorage } from "@/utils/browserStorage";
import { getTrackingIds } from "@/utils/utils";

import ConfirmModal from '../../components/confirmModal';
import Footer from "../../components/footer";
import InfoPopup from '../../components/infoPopup';
import Placeholders from "../../components/placeholders";

import {
  ChevronDown,
  FileText,
  Globe,
  Link,
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
import DealsPromotionCard from "../../components/deals-promotion-card";
import LinkTypeNotice from "./linktype-notice";
import { LinkType } from "@/utils/utils";
import { Template } from "@/utils/template_utils";
import PromptEditor from "./prompt-editor";


export default function Page() {
  const [trackingIds, setTrackingIds] = useState([])
  const defaultContent = '🎉 Limited Time Offer! 🎉\n{product_name}\n\n{discount_percentage} OFF!\nSave an extra ${coupon_$} with clip on coupon\n#ad\n{amz_link}'
  const defaultTemplate = {
    id: "default",
    name: 'Default Template',
    content: defaultContent,
    titleWordLimit: 10,
    trackingId: trackingIds[0]?.id || '',
    isDefault: true,
    linkType: 'amazon',
  }

  const [templates, setTemplates] = useState([defaultTemplate] as Template[])
  const [activeTemplateId, setActiveTemplateId] = useState(defaultTemplate.id)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [popupMessage, setPopupMessage] = useState("")
  const [popupType, setPopupType] = useState<'success' | 'error'>('success')
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const activeTemplate = templates.find(t => t.id === activeTemplateId) || defaultTemplate

  const handleClosePopup = () => setIsPopupOpen(false)

  const handleAddTemplate = () => {
    if (newTemplateName.trim()) {
      const id = Date.now().toString(36) + Math.random().toString(36).substring(2)
      const newTemplate = {
        id,
        name: newTemplateName,
        content: '',
        titleWordLimit: 10,
        trackingId: trackingIds[0]?.id || '',
        isDefault: false,
        linkType: 'amazon'
      } as Template;
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
      setTemplates(updatedTemplates as Template[])
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
      // Ensure all templates have a linkType (default to 'amazon' for backward compatibility)
      const updatedTemplates = templatesData.map(template => ({
        ...template,
        linkType: template.linkType || 'amazon'
      }));
      setTemplates(updatedTemplates)

      // Save the updated templates back to storage
      await browserStorage.set('templates', JSON.stringify(updatedTemplates));

      const defaultTemplate = updatedTemplates.find(t => t?.isDefault) || updatedTemplates[0]
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

  useEffect(() => {
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
            <DealsPromotionCard />
            {/* <LicenseStatusHeader /> */}
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">

        <div className="relative bg-white rounded-lg shadow-sm border border-gray-200 p-6">

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
                  disabled={activeTemplate?.isDefault}
                  className={`group min-w-[160px] px-4 py-2.5 rounded-lg font-medium
                      focus:outline-none focus:ring-2 focus:ring-offset-2 
                      transition-all duration-200 flex items-center justify-center
                      ${!activeTemplate?.isDefault
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
                      : 'group-hover:fill-white transition-colors duration-200'
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
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTemplate()}
                  placeholder="Create New Template"
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                />
                <button
                  onClick={handleAddTemplate}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400 transition-colors group"
                >
                  <Plus size={18} className="transition-transform duration-200 group-hover:rotate-90" />
                </button>
              </div>
            </div>
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
                  />
                  <p className="text-xs text-gray-500 mt-1">The maximum number of words in the product title</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Link size={16} className="mr-2" />
                    Link Generation Type
                  </label>
                  <select
                    value={activeTemplate.linkType || 'amazon'}
                    onChange={(e) => updateActiveTemplate({ linkType: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 bg-white transition-all"
                  >
                    <option value="amazon">Amazon Short Link</option>
                    <option value="posttap">PostTap</option>
                    <option value="joylink">JoyLink</option>
                    <option value="geniuslink">GeniusLink</option>
                    <option value="linktwin">LinkTwin</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Choose how affiliate links will be generated for this template</p>
                </div>

                {/* Login Notice for Deep Linkers */}
                {activeTemplate.linkType && activeTemplate.linkType !== 'amazon' && (
                  <LinkTypeNotice linkType={activeTemplate.linkType as LinkType} />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4 pt-4">
                <button
                  onClick={handleSaveTemplate}
                  disabled={!hasChanges}
                  className={`flex items-center space-x-2 px-4 py-3 border rounded-lg transition-all duration-200 font-medium ${hasChanges
                    ? 'bg-green-50 border-green-300 hover:bg-green-100 text-green-800'
                    : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <Save className={`h-5 w-5 ${hasChanges ? 'text-green-500' : 'text-gray-400'}`} />
                  <span>Save Changes</span>
                  {hasChanges && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>}
                </button>

                <button
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-3 bg-red-50 border border-red-300 hover:bg-red-100 text-red-800 rounded-lg transition-all duration-200 font-medium"
                >
                  <Trash2 className="h-5 w-5 text-red-500" />
                  <span>Delete Template</span>
                </button>
              </div>
              <PromptEditor />
            </div>

            {/* Right Column - Placeholders */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <Placeholders />
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