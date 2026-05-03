import { Copy, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

const ProductImageCard = ({ productData, imageCopied, copyImageToClipboard }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 
  const allImages = productData?.image_url
    ? [...(productData.alt_images || [])]
    : [];

  // Reset index when product data changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [productData?.image_url]);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const currentImage = allImages[currentImageIndex];
  console.log('All Images:', productData);
  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">

      <div className="p-5">
        {productData?.image_url ? (
          <div className="space-y-4">

            {/* Image Container with Navigation */}
            <div className="relative rounded-lg border border-gray-100 bg-gray-50 overflow-hidden group h-64 flex items-center justify-center p-4">
              <img
                src={currentImage}
                alt="Product Preview"
                className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
              />

              {/* Navigation Buttons - Only show if there are multiple images */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Image Counter */}
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    {currentImageIndex + 1} / {allImages.length}
                  </div>
                </>
              )}
            </div>

            {/* Copy Button - Kept exact style */}
            <button
              onClick={() => copyImageToClipboard(currentImage)}
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