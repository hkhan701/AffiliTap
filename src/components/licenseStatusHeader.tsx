import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { getLicenseStatus, getCurrentPlan } from "@/utils/license";

export default function LicenseStatusHeader() {
  const [status, setStatus] = useState({
    licenseStatus: "",
    currentPlan: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [license, plan] = await Promise.all([
          getLicenseStatus(),
          getCurrentPlan()
        ]);

        setStatus({
          licenseStatus: license,
          currentPlan: plan,
          isLoading: false,
          error: null
        });
      } catch (error) {
        setStatus(prev => ({
          ...prev,
          isLoading: false,
          error: "Failed to fetch license status"
        }));
      }
    };

    fetchData();
  }, []);

  if (status.isLoading) {
    return (
      <div className="w-full mb-4 p-4 rounded-lg bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-5 w-5 text-gray-400 animate-spin mr-2" />
        <span className="text-sm text-gray-500">Checking license status...</span>
      </div>
    );
  }

  const isActive = status.licenseStatus === 'active';

  return (
    <div className="w-full p-4 rounded-lg border transition-colors duration-200 hover:bg-gray-50 flex items-center justify-between group bg-gray-100">
      <div className="flex flex-col mr-4">
        <span className="text-sm font-semibold text-gray-700">License Status</span>
        {isActive && (
          <span className="text-xs text-gray-500 mt-1">
            Current Plan: {status.currentPlan}
          </span>
        )}
      </div>
      
      <div className="flex items-center">
        {isActive ? (
          <div className="flex items-center text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            <CheckCircle className="h-4 w-4 mr-1.5" />
            <span className="text-sm font-medium">Active</span>
          </div>
        ) : (
          <div className="flex items-center text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
            <span className="text-sm font-medium">Free plan</span>
          </div>
        )}
      </div>
    </div>
  );
}