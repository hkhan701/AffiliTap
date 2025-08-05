import { Image, Copy, CheckCircle, AlertCircle } from 'lucide-react';

const ProductImageCard = ({ productData, imageCopied, copyImageToClipboard }) => {
  return (
    <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-blue-500">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <Image className="w-5 h-5 mr-2" />
          Product Image
        </h2>
      </div>

      <div className="p-6">
        {productData?.image_url ? (
          <div className="space-y-4">
            {/* Image Container */}
            <div className="relative rounded-xl overflow-hidden bg-gray-50">
              <img
                src={productData.image_url}
                alt="Product"
                className={`w-full h-64 object-contain transition-all duration-300}`}
              />

            </div>

            {/* Copy Button */}
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
                  Copied to Clipboard!
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
          // Empty State
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl p-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium text-center mb-1">
              No Product Image Available
            </p>
            <p className="text-gray-400 text-sm text-center">
              Please make sure you're on a valid product page
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductImageCard;