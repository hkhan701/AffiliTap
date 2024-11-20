import { useState } from 'react';
import { HelpCircle, Mail, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

export default function HelpCard() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md transition-all duration-300 hover:shadow-lg mt-8 border border-gray-100">
      {/* Header */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200 rounded-t-xl"
      >
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-800">
            Having Trouble?
          </h2>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-6 space-y-4 border-t border-gray-100">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm leading-relaxed text-gray-700">
              Occasionally, retailers modify their websites layout, which may prevent AffiliTap from fetching data accurately.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Common issues and solutions:
            </p>
            <ul className="list-disc text-sm text-gray-600 pl-5 space-y-2">
              <li>If a recently added template isn't showing in the side panel, try closing and reopening the panel</li>
              <li>If no data is loading, try refreshing the Amazon page first</li>
              <li>If templates aren't filling in correctly, please send us:</li>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>1-2 product links experiencing issues</li>
                <li>Description of missing data</li>
                <li>Your template content</li>
              </ul>
            </ul>
          </div>

          <a
            href="mailto:affilitap@gmail.com"
            className="inline-flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg transition-colors duration-200 group mt-2"
          >
            <Mail className="w-4 h-4" />
            <span className="font-medium">affilitap@gmail.com</span>
            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </a>

          <p className="text-xs text-gray-500 mt-4">
            We typically respond within 24 business hours.
          </p>
        </div>
      )}
    </div>
  );
}