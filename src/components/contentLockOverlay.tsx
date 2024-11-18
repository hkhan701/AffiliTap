import { FaLock } from 'react-icons/fa';
import { handlePurchaseRedirect } from "@/utils/utils"

const ContentLockOverlay = ({ isContentLocked }) => {
  if (!isContentLocked) return null;

  return (
    <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-lg">
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
  );
};

export default ContentLockOverlay;
