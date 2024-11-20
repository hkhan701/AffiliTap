import { Lock, ShoppingCart, Sparkles } from "lucide-react";
import { handlePurchaseRedirect } from "@/utils/utils";

const ContentLockOverlay = ({ isContentLocked }: { isContentLocked: boolean }) => {
  if (!isContentLocked) return null;

  return (
    <div className="absolute inset-0 bg-gray-100/70 z-10 flex items-center justify-center rounded-lg">
      <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md border border-gray-200">
        <div className="flex justify-center items-center bg-gray-100 rounded-full h-16 w-16 mx-auto mb-4">
          <Lock className="h-8 w-8 text-blue-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          Feature Restricted
        </h3>
        <p className="text-gray-600 mb-6">
          This feature requires an active license. Upgrade to unlock!
        </p>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-all focus:outline-none focus:ring focus:ring-blue-300 relative overflow-hidden"
          onClick={handlePurchaseRedirect}
        >
          <div className="flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            <span className="relative z-10">Purchase License</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ContentLockOverlay;
