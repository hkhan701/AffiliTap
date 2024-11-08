import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { FaCog, FaPlus, FaArrowLeft, FaCheck, FaTimes, FaCopy } from "react-icons/fa";
import { browser } from "webextension-polyfill-ts";
import { activateLicenseKey, getLicenseStatus, getCurrentPlan } from "@/utils/license";
import { handlePurchaseRedirect, handleAddTemplate, getShortUrl, shortenProductName } from "@/utils/utils";
import { browserStorage } from "@/utils/browserStorage";
import InfoPopup from '../popup/infoPopup';
import LicenseStatusHeader from "../page/licenseStatusHeader";
// @ts-ignore
import logo from 'src/assets/images/logo.svg';

import "../../globals.css";
import { get } from "http";

interface Template {
    id: string;
    name: string;
    content: string;
    titleWordLimit: number;
}

export default function SidePanel() {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [licenseStatus, setLicenseStatus] = useState("");
    const [licenseKey, setLicenseKey] = useState("");
    const [currentPlan, setCurrentPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [popupType, setPopupType] = useState<'success' | 'error'>('success');
    const [productData, setProductData] = useState(null);
    const [trackingIds, setTrackingIds] = useState([]);
    const [copied, setCopied] = useState(false)
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("");

    const [previewText, setPreviewText] = useState<string>("");

    const handleOpenSettings = () => setIsSettingsOpen(true);
    const handleBack = () => setIsSettingsOpen(false);
    const handleClosePopup = () => setIsPopupOpen(false);

    const fetchTemplates = async () => {
        const storedTemplates = await browserStorage.get('templates');
        // store template as array
        if (storedTemplates) {
            const templatesData = JSON.parse(storedTemplates);
            setTemplates(templatesData);
            if (templatesData.length > 0) {
                setSelectedTemplate(templatesData[0].id);
            }
        }
    };

    const handleTemplateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedTemplate = templates.find(template => template.id === event.target.value);
        if (selectedTemplate) {
            console.log("The selected template name is: ", selectedTemplate.name);
        }
        setSelectedTemplate(event.target.value);
    };

    const isContentLocked = licenseStatus !== 'active';

    const getTrackingIds = async () => {
        // for US: https://www.amazon.com/associates/sitestripe/getStoreTagMap?marketplaceId=1
        const response = await fetch(`https://www.amazon.ca/associates/sitestripe/getStoreTagMap?marketplaceId=7`);
        const data = await response.json();
        const trackingIds = Object.values(data.storeTagMap).flat();
        setTrackingIds(trackingIds);
    };

    const fetchProductData = async () => {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];

        if (activeTab?.id) {
            try {
                // Send a message to the content script to get product data
                const response = await browser.tabs.sendMessage(activeTab.id, { action: "REQUEST_PRODUCT_DATA" });
                setProductData(response.data);
            } catch (error) {
                console.error("Error fetching product data:", error);
            }
        }
    };

    const fetchLicenseStatus = async () => {
        const [licenseStatus, currentPlan] = await Promise.all([getLicenseStatus(), getCurrentPlan()]);
        setLicenseStatus(licenseStatus);
        setCurrentPlan(currentPlan);
    };

    const handleProductDataUpdate = ({ action, data }: { action: string; data: any; }) =>
        action === "UPDATE_PRODUCT_DATA" && setProductData(data);

    useEffect(() => {
        getTrackingIds();
        fetchProductData();
        fetchLicenseStatus();
        fetchTemplates();

        // Listen for product data updates from the background script
        browser.runtime.onMessage.addListener(handleProductDataUpdate);
        return () => {
            browser.runtime.onMessage.removeListener(handleProductDataUpdate);
        };
    }, []);

    const handleSaveLicense = async () => {
        setLoading(true);
        try {
            const result = await activateLicenseKey(licenseKey);
            if (result) {
                setPopupMessage("License activated successfully!");
                setPopupType('success');
                await fetchLicenseStatus();
            } else {
                setPopupMessage("License activation failed. Please check your key.");
                setPopupType('error');
            }
        } catch (error) {
            setPopupMessage("There was an error activating the license. Please try again.");
            setPopupType('error');
        }
        setIsPopupOpen(true);
        setLoading(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // This effect will update the preview text whenever product data, the selected template, or templates change
    useEffect(() => {
        if (templates.length > 0) {
            const selectedTemplateContent = templates.find(t => t.id === selectedTemplate)?.content || "";
            generatePreviewText(selectedTemplateContent).then((previewText) => {
                setPreviewText(previewText);
            });
        }
    }, [productData, selectedTemplate, templates]);

    const generatePreviewText = async (templateContent: string): Promise<string> => {
        if (!productData) {
            return "No product data available. Loading...";
        }

        const amz_link = await getShortUrl(trackingIds[0]);
        const titleLimit = templates.find(t => t.id === selectedTemplate)?.titleWordLimit;
        const limitedTitle = shortenProductName(productData.product_name, titleLimit);

        return templateContent
            .replace(/{product_name}/g, limitedTitle || "")
            .replace(/{current_price}/g, productData.current_price || "")
            .replace(/{list_price}/g, productData.list_price || "")
            .replace(/{discount_percentage}/g, productData.percent_off_list_price || "")
            .replace(/{coupon_\x24}/g, productData.coupon_amount || "")
            .replace(/{coupon_%}/g, productData.coupon_percentage || "")
            .replace(/{promo_code}/g, productData.promo_code || "")
            .replace(/{promo_code_%}/g, productData.promo_code_percent_off || "")
            .replace(/{amz_link}/g, amz_link || "");

    };

    return (
        <div className="bg-blue-100 h-full">
            <div className="p-4 border-b border-gray-200">
                <img src={logo} alt="logo" width={200} />
            </div>
            <div className="p-4">
                <div className="flex flex-col items-center space-y-8">
                    {isSettingsOpen ? (
                        <>
                            <h2 className="text-xl font-semibold text-gray-800">Enter License Key</h2>
                            <div className="flex flex-col space-y-2 w-full">
                                <input
                                    type="text"
                                    placeholder="Enter your license key"
                                    value={licenseKey}
                                    onChange={(e) => setLicenseKey(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={handleSaveLicense}
                                    className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    disabled={loading}
                                >
                                    {loading ? "Activating..." : "Save"}
                                </button>
                            </div>
                            <p className="text-sm text-gray-600">Don't have a license key?</p>
                            <button
                                onClick={handlePurchaseRedirect}
                                className="w-full bg-white text-blue-500 font-semibold py-2 px-4 rounded-md border border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                                Purchase a license
                            </button>
                            <button onClick={handleBack} className="mt-4 text-gray-600 hover:text-gray-800">
                                <FaArrowLeft className="inline-block mr-2 h-4 w-4" />
                                Back
                            </button>
                        </>
                    ) : (
                        <>
                            <LicenseStatusHeader />
                            <button
                                onClick={handleAddTemplate}
                                className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center justify-center"
                            >
                                <FaPlus className="mr-2 h-4 w-4" />
                                Create New Template
                            </button>
                            <button
                                onClick={handleOpenSettings}
                                className="border-solid border-2 border-black w-full bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center justify-center"
                            >
                                <FaCog className="mr-2 h-4 w-4" />
                                Settings
                            </button>

                            <div className="w-full">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Select your Template</h2>
                                <select
                                    value={selectedTemplate}
                                    onChange={handleTemplateChange}
                                    className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                                >
                                    {templates.length > 0 ? (
                                        templates.map((template) => (
                                            <option key={template.id} value={template.id}>
                                                {template.name}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>No templates available</option>
                                    )}
                                </select>
                            </div>


                            <div className="w-full bg-white rounded-lg shadow-md p-4">
                                <h2 className="text-lg font-semibold mb-2">Post Preview</h2>
                                <div className="bg-gray-100 rounded-lg p-4 mb-2">
                                    <pre className="text-sm whitespace-pre-wrap">{previewText}</pre>
                                </div>
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => copyToClipboard(previewText)}
                                        className={
                                            `px-2 py-1 text-md font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${copied ? 'animate-pulse text-green-500' : ''}`
                                        }
                                        disabled={isContentLocked}
                                    >
                                        <FaCopy className="inline-block mr-1 h-3 w-3" />
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            {productData ? (
                                <ul>
                                    {Object.entries(productData).map(([key, value]) => (
                                        <li key={key}>
                                            <strong>{key}:</strong> {JSON.stringify(value)}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No product data available.</p>
                            )}
                            {trackingIds ? (
                                <ul>
                                    {trackingIds.map((id) => (
                                        <li key={id}>{id}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No tracking IDs available.</p>
                            )}


                        </>
                    )}
                </div>
            </div>
            {/* License Error/Success Popup */}
            <InfoPopup
                isOpen={isPopupOpen}
                message={popupMessage}
                type={popupType}
                onClose={handleClosePopup}
            />
        </div>
    );
}

createRoot(document.getElementById("root")!).render(<SidePanel />);
