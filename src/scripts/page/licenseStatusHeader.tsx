import { FaCheck, FaTimes } from "react-icons/fa";
import { useEffect, useState } from "react";
import { getLicenseStatus, getCurrentPlan } from "@/utils/license";


export default function LicenseStatusHeader() {

    const fetchLicenseStatusAndPlan = async () => {
        setLicenseStatus(await getLicenseStatus());
        setCurrentPlan(await getCurrentPlan());
    };

    useEffect(() => {
        fetchLicenseStatusAndPlan();
    }, []);

    const [licenseStatus, setLicenseStatus] = useState("");
    const [currentPlan, setCurrentPlan] = useState<string | null>(null);

    return (
        <div className="w-full mb-4 p-2 rounded-md bg-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">License Status:</span>
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
    )
}