import React from 'react';
import { Copy, CheckCircle, AlertCircle } from 'lucide-react';

const ProductImageCard = ({ productData, imageCopied, copyImageToClipboard }) => {
  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">

      <div className="p-5">
        {productData?.image_url ? (
          <div className="space-y-4">

            {/* Image Container - No text needed, the image speaks for itself */}
            <div className="relative rounded-lg border border-gray-100 bg-gray-50 overflow-hidden group h-64 flex items-center justify-center p-4">
              <img
                src={productData.image_url}
                alt="Product Preview"
                className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* Copy Button - Kept exact style */}
            <button
              onClick={() => copyImageToClipboard(productData?.image_url)}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium
                          transition-all duration-200 ${imageCopied
                  ? 'bg-green-50 text-green-600 border border-green-200'
                  : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {imageCopied ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Copy High Quality Image
                </>
              )}
            </button>
          </div>
        ) : (
          // Empty State - Compressed
          <div className="flex flex-col items-center justify-center h-64 rounded-lg border-2 border-dashed border-gray-100 bg-gray-50/50">
            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm font-medium">
              No Product Image Found
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductImageCard;