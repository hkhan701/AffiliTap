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
              If your templates aren't filling in as expected, please help us investigate by:
            </p>
            <ul className="list-disc text-sm text-gray-600 pl-5 space-y-2">
              <li>Sending 1-2 product links experiencing issues</li>
              <li>Describing which data is missing</li>
              <li>Including your template name</li>
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