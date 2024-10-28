import { createRoot } from "react-dom/client"
import { useState, useEffect } from 'react'
import { FaPlus, FaTrash, FaSave, FaCheck, FaTimes, FaCopy, FaLock } from 'react-icons/fa'
import { getLicenseStatus, getCurrentPlan } from "@/utils/license"
import { browserStorage } from "@/utils/browserStorage"
import Footer from "./footer"
import InfoPopup from '../popup/infoPopup'
import logo from 'src/assets/images/logo.svg'
import "../../globals.css"

export default function Page() {
  const [templates, setTemplates] = useState([
    { id: "default", name: 'Default Template', content: '' }
  ])
  const [activeTemplate, setActiveTemplate] = useState(templates[0].id)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [editingName, setEditingName] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [licenseStatus, setLicenseStatus] = useState("")
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [popupMessage, setPopupMessage] = useState("")
  const [popupType, setPopupType] = useState<'success' | 'error'>('success')

  const handleClosePopup = () => setIsPopupOpen(false)

  type Placeholder = {
    key: string
    description: string
  }

  const placeholders: Placeholder[] = [
    { key: '{title}', description: 'The title of the product' },
    { key: '{final_price}', description: 'The final price of the product' },
    { key: '{list_price}', description: 'The original list price of the product' },
    { key: '{discount_percentage}', description: 'The discount percentage' },
    { key: '{rating}', description: 'The product rating' },
    { key: '{review_count}', description: 'The number of reviews' },
  ]

  const handleCopyPlaceholder = (placeholder: string) => {
    navigator.clipboard.writeText(placeholder)
    alert(`${placeholder} copied to clipboard`)
  }

  useEffect(() => {
    const currentTemplate = templates.find(t => t.id === activeTemplate)
    if (currentTemplate) {
      setEditingName(currentTemplate.name)
    }
  }, [activeTemplate])

  const handleAddTemplate = () => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2)
    if (newTemplateName.trim()) {
      const newTemplate = {
        id,
        name: newTemplateName,
        content: ''
      }
      setTemplates([...templates, newTemplate])
      setActiveTemplate(newTemplate.id)
      setNewTemplateName('')
      setEditingName(newTemplate.name)
      setHasChanges(true)
    }
  }

  const handleDeleteTemplate = (id: string) => {
    const updatedTemplates = templates.filter(template => template.id !== id)
    if (updatedTemplates.length === 0) {
      setPopupMessage("Cannot delete the last template")
      setPopupType('error')
      setIsPopupOpen(true)
      return
    }
    setTemplates(updatedTemplates)
    try {
      browserStorage.set('templates', JSON.stringify(updatedTemplates))
      setPopupMessage("Template deleted successfully")
      setPopupType('success')
      setIsPopupOpen(true)
    } catch {
      setPopupMessage("Error deleting templates")
      setPopupType('error')
      setIsPopupOpen(true)
    }
    if (activeTemplate === id) {
      setActiveTemplate(updatedTemplates[0].id)
      setEditingName(updatedTemplates[0].name)
    }
    setHasChanges(true)
  }

  const handleSaveTemplate = () => {
    const updatedTemplates = templates.map(template =>
      template.id === activeTemplate
        ? { ...template, name: editingName }
        : template
    )
    setTemplates(updatedTemplates)
    try {
      browserStorage.set('templates', JSON.stringify(updatedTemplates))
      setPopupMessage("Template saved successfully")
      setPopupType('success')
      setIsPopupOpen(true)
      setHasChanges(false)
    } catch {
      setPopupMessage("Error saving templates")
      setPopupType('error')
      setIsPopupOpen(true)
    }
  }

  const handleTemplateContentChange = (content: string) => {
    setTemplates(templates.map(template =>
      template.id === activeTemplate ? { ...template, content } : template
    ))
    setHasChanges(true)
  }

  const handleTemplateChange = (id: string) => {
    setActiveTemplate(id)
    const template = templates.find(t => t.id === id)
    if (template) {
      setEditingName(template.name)
    }
  }

  const isContentLocked = licenseStatus !== 'active'

  useEffect(() => {
    const fetchTemplates = async () => {
      const storedTemplates = await browserStorage.get('templates')
      if (storedTemplates) {
        const templatesData = JSON.parse(storedTemplates)
        setTemplates(templatesData)
        if (templatesData.length > 0) {
          setActiveTemplate(templatesData[0].id)
          setEditingName(templatesData[0].name)
        }
      }
    }

    const fetchLicenseStatus = async () => {
      const status = await getLicenseStatus()
      setLicenseStatus(status)
      const plan = await getCurrentPlan()
      setCurrentPlan(plan)
    }

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
            <span className="mr-2 text-sm font-medium text-gray-700">License Status:</span>
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
                  onClick={() => window.open("https://affilitap.lemonsqueezy.com/checkout", "_blank")}
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
                  value={activeTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
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
                  placeholder="New Template Name"
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
                  value={editingName}
                  onChange={(e) => {
                    setEditingName(e.target.value)
                    setHasChanges(true)
                  }}
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
                    value={templates.find(t => t.id === activeTemplate)?.content || ''}
                    onChange={(e) => handleTemplateContentChange(e.target.value)}
                    placeholder="Product title: {title}&#10;Final price: {final_price}&#10;List price: {list_price}"
                    className="w-full h-64 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono disabled:bg-gray-100 disabled:text-gray-500"
                    disabled={isContentLocked}
                  />
                </div>

                <div className="w-72">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-800">Placeholders</h2>
                    </div>
                    <div className="p-4">
                      <div className="space-y-3">
                        {placeholders.map((placeholder) => (
                          <div key={placeholder.key} className="flex flex-col">
                            <div className="flex items-center justify-between">
                              <p className="font-mono text-sm text-gray-700">{placeholder.key}</p>
                              <button
                                onClick={() => handleCopyPlaceholder(placeholder.key)}
                                className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                disabled={isContentLocked}
                              >
                                <FaCopy className="inline-block mr-1 h-3 w-3" />
                                Copy
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{placeholder.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-start space-x-3">
              <button
                onClick={handleSaveTemplate}
                disabled={!hasChanges || isContentLocked}
                className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center ${
                  hasChanges && !isContentLocked
                    ? 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <FaSave className="mr-2" /> Save
              </button>
              <button
                onClick={() => handleDeleteTemplate(activeTemplate)}
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