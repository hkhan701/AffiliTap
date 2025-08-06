import { useState, useEffect, useRef } from 'react';
import { Sparkles, Save, Brain } from 'lucide-react';
import InfoPopup from '../../components/infoPopup';
import ConfirmModal from '@/components/confirmModal';
import { defaultPrompts } from 'src/utils/template_utils';

const promptTypes = [
  'Promo Code',
  'Price Drop',
  'Clip Coupon',
  'Checkout Discount',
  'Custom Instructions',
] as const;

type PromptType = typeof promptTypes[number];

const variableTags = [
  { label: 'Product Title', value: '{product_title}', bgColor: 'bg-green-50', borderColor: 'border-green-300', textColor: 'text-green-700' },
  { label: 'Current Price', value: '{current_price}', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', textColor: 'text-blue-700' },
  { label: 'List Price', value: '{list_price}', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', textColor: 'text-blue-700' },
  { label: 'Discount Percentage', value: '{discount_percentage}', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', textColor: 'text-blue-700' },
  { label: 'Coupon', value: '{coupon}', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', textColor: 'text-blue-700' },
  { label: 'Coupon Percentage', value: '{coupon_percentage}', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', textColor: 'text-blue-700' },
  { label: 'Promo Code', value: '{promo_code}', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', textColor: 'text-blue-700' },
  { label: 'Promo Code Discount', value: '{discount_percent}', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', textColor: 'text-blue-700' },
  { label: 'Checkout Discount', value: '{checkout_discount}', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', textColor: 'text-blue-700' },
  { label: 'Final Price', value: '{final_price}', bgColor: 'bg-gray-50', borderColor: 'border-gray-300', textColor: 'text-gray-700' },
  { label: 'Rating', value: '{rating}', bgColor: 'bg-amber-50', borderColor: 'border-amber-300', textColor: 'text-amber-700' },
  { label: 'Affiliate Link', value: '{affiliate_link}', bgColor: 'bg-red-50', borderColor: 'border-red-300', textColor: 'text-red-700' },
];

export default function PromptEditor() {
  const [selectedTab, setSelectedTab] = useState<PromptType>('Promo Code');
  const [promptText, setPromptText] = useState<string>('');
  const [originalText, setOriginalText] = useState<string>('');
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Popup state
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<'success' | 'error' | 'warning'>('success');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_CHARACTERS = 750; // Maximum characters allowed in the prompt

  useEffect(() => {
    const saved = localStorage.getItem(`prompt-${selectedTab}`) || '';
    setPromptText(saved);
    setOriginalText(saved);
    setHasChanges(false);
  }, [selectedTab]);

  useEffect(() => {
    setHasChanges(promptText !== originalText);
  }, [promptText, originalText]);

  const handleInsertVariable = (value: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Insert the variable at cursor position
    const newText = promptText.slice(0, start) + value + promptText.slice(end);
    setPromptText(newText);

    // Set cursor position after the inserted text
    const newCursorPosition = start + value.length;

    // Use setTimeout to ensure the text is updated before setting cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= MAX_CHARACTERS) {
      setPromptText(newText);
    }
  };

  const handleSave = () => {
    try {
      localStorage.setItem(`prompt-${selectedTab}`, promptText.trim());
      setOriginalText(promptText);
      setHasChanges(false);
      setPopupMessage(`AI training prompt for "${selectedTab}" has been saved successfully!`);
      setPopupType('success');
      setIsPopupOpen(true);
    } catch (error) {
      setPopupMessage('Failed to save AI training prompt. Please try again.');
      setPopupType('error');
      setIsPopupOpen(true);
    }
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  const handleLoadDefaultsClick = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmLoadDefaults = () => {
    try {
      // Save all default prompts to localStorage
      Object.entries(defaultPrompts).forEach(([type, prompt]) => {
        localStorage.setItem(`prompt-${type}`, prompt);
      });

      // Update current prompt text if it matches the selected tab
      setPromptText(defaultPrompts[selectedTab]);
      setOriginalText(defaultPrompts[selectedTab]);
      setHasChanges(false);

      setPopupMessage('Default prompts have been loaded and saved for all types!');
      setPopupType('success');
      setIsPopupOpen(true);
      setIsConfirmModalOpen(false);
    } catch (error) {
      setPopupMessage('Failed to load default prompts. Please try again.');
      setPopupType('error');
      setIsPopupOpen(true);
      setIsConfirmModalOpen(false);
    }
  };

  const handleCancelLoadDefaults = () => {
    setIsConfirmModalOpen(false);
  };

  return (
    <>
      <div className="w-full mx-auto p-4 bg-white rounded-xl shadow border space-y-4 font-sans">
        {/* Train Your AI Header - Gradient Style */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200 mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Train Your AI
            </h2>
          </div>
          <p className="text-sm text-gray-700 text-center">
            Customize AI-generated posts by training it with your preferred style and tone
          </p>
          <div className="flex justify-center mt-3">
            <button
              onClick={handleLoadDefaultsClick}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all duration-200 font-medium text-sm"
            >
              <Sparkles className="h-4 w-4" />
              <span>Load Default Templates</span>
            </button>
          </div>
        </div>

        <div className="flex space-x-2 overflow-x-auto">
          {promptTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedTab(type)}
              className={`px-4 py-2 rounded-lg border whitespace-nowrap ${selectedTab === type ? 'bg-purple-100 border-purple-500 text-purple-700' : 'bg-gray-50 border-gray-200 text-gray-700'
                } transition-all duration-200`}
            >
              {type}
            </button>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
              <Sparkles size={16} /> Instructions for "{selectedTab}":
            </p>
            <div className={`text-sm font-medium ${promptText.length > MAX_CHARACTERS * 0.9
              ? 'text-red-600'
              : promptText.length > MAX_CHARACTERS * 0.8
                ? 'text-amber-600'
                : 'text-gray-500'
              }`}>
              {promptText.length}/{MAX_CHARACTERS}
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Write a post as if for social media. Feel free to use emojis. Click a variable to insert at cursor position.
          </p>
          <textarea
            ref={textareaRef}
            className={`w-full min-h-[250px] p-3 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${promptText.length > MAX_CHARACTERS * 0.9
              ? 'border-red-300 bg-red-50'
              : 'border-gray-200'
              }`}
            value={promptText}
            onChange={handleTextChange}
            placeholder={`Start typing your ${selectedTab.toLowerCase()} social media post template...`}
            maxLength={MAX_CHARACTERS}
          />
          {promptText.length > MAX_CHARACTERS * 0.9 && (
            <p className="text-xs text-red-600 mt-1">
              {promptText.length >= MAX_CHARACTERS
                ? 'Character limit reached'
                : `${MAX_CHARACTERS - promptText.length} characters remaining`
              }
            </p>
          )}
        </div>

        <div>
          <p className="text-sm text-gray-700 font-medium mb-2">Available Variables:</p>
          <div className="flex flex-wrap gap-2">
            {variableTags.map((v) => (
              <button
                key={v.value}
                className={`text-sm px-3 py-2 rounded-lg ${v.bgColor} ${v.borderColor} ${v.textColor} border hover:scale-105 transition-all duration-200 font-medium`}
                onClick={() => handleInsertVariable(v.value)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
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
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Load Default Templates"
        message="This will replace all current prompts with default templates. Any unsaved changes will be lost. Are you sure you want to continue?"
        onConfirm={handleConfirmLoadDefaults}
        onCancel={handleCancelLoadDefaults}
        confirmText="Load Templates"
        cancelText="Cancel"
        variant="warning"
      />

      <InfoPopup
        isOpen={isPopupOpen}
        message={popupMessage}
        type={popupType}
        onClose={handleClosePopup}
        title={popupType === 'success' ? 'Saved Successfully' : 'Save Failed'}
      />
    </>
  );
}