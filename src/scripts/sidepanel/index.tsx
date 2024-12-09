import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { browser } from "webextension-polyfill-ts";
import { getLicenseStatus, getCurrentPlan } from "@/utils/license";
import { handleAddTemplate, getShortUrl, shortenProductName, convertJpgToPng, handleBillingRedirect } from "@/utils/utils";
import { browserStorage } from "@/utils/browserStorage";
import { Settings as SettingsIcon, Plus, ArrowLeft, Hash, AlertTriangle, CheckCircle, Copy, Eye, Lock, AlertCircle, ChevronDown, Layers3 } from 'lucide-react';
// @ts-ignore
import logo from 'src/assets/images/logo.svg';

import InfoPopup from '../../components/infoPopup';
import LicenseStatusHeader from "../../components/licenseStatusHeader";
import HelpCard from "../../components/helpCard";
import Settings from "./settings";
import ProductImageCard from "@/components/productImageCard";

import "../../globals.css";

interface Template {
    id: string;
    name: string;
    content: string;
    titleWordLimit: number;
    trackingId: string;
    isDefault: boolean;
}

export default function SidePanel() {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [licenseStatus, setLicenseStatus] = useState("");
    const [currentPlan, setCurrentPlan] = useState<string | null>(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [popupType, setPopupType] = useState<'success' | 'error'>('success');
    const [productData, setProductData] = useState(null);
    const [copied, setCopied] = useState(false)
    const [imageCopied, setImageCopied] = useState(false);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("");

    const [previewText, setPreviewText] = useState<string>("");

    const handleOpenSettings = () => setIsSettingsOpen(true);
    const handleBack = () => setIsSettingsOpen(false);
    const handleClosePopup = () => setIsPopupOpen(false);

    const PRO_ONLY_PLACEHOLDERS = ["{coupon_$}", "{coupon_%}", "{promo_code}", "{promo_code_%}"];

    const checkForProPlaceholders = (templateContent: string): boolean => {
        return PRO_ONLY_PLACEHOLDERS.some((placeholder) => templateContent?.includes(placeholder));
    };

    const fetchTemplates = async () => {
        const storedTemplates = await browserStorage.get('templates');
        // store template as array
        if (storedTemplates) {
            const templatesData = JSON.parse(storedTemplates);
            setTemplates(templatesData);
            const defaultTemplate = templatesData.find(t => t.isDefault) || templatesData[0]
            if (defaultTemplate) {
                setSelectedTemplate(defaultTemplate.id)
            }
        }
    };

    const handleTemplateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedTemplate(event.target.value);
    };

    const isContentLocked = licenseStatus !== 'active';

    const fetchProductData = async () => {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];

        if (activeTab?.id) {
            try {
                // Send a message to the content script to get product data
                const response = await browser.tabs.sendMessage(activeTab.id, { action: "REQUEST_PRODUCT_DATA" });
                if (browser.runtime.lastError) {
                    // console.log("Failed to fetch product data:", browser.runtime.lastError);
                } else {
                    setProductData(response.data);
                }
            } catch (error) {
                // console.log("Error fetching product data:", error);
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
        fetchProductData();
        fetchLicenseStatus();
        fetchTemplates();

        // Listen for product data updates from the background script
        browser.runtime.onMessage.addListener(handleProductDataUpdate);
        return () => {
            browser.runtime.onMessage.removeListener(handleProductDataUpdate);
        };
    }, []);

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

        const currentTemplate = templates.find(t => t.id === selectedTemplate);
        const amz_link = await getShortUrl(currentTemplate?.trackingId);
        const limitedTitle = shortenProductName(productData.product_name, currentTemplate?.titleWordLimit);

        let preview = templateContent
            .replace(/{product_name}/g, limitedTitle || "")
            .replace(/{current_price}/g, productData.current_price || "")
            .replace(/{list_price}/g, productData.list_price || "")
            .replace(/{discount_percentage}/g, productData.percent_off_list_price || "")
            .replace(/{rating}/g, productData.rating || "")
            .replace(/{amz_link}/g, amz_link || "");

        // Only replace coupon and promo code placeholders if the user is on the Pro plan
        if (currentPlan === "Pro Plan") {
            preview = preview
                .replace(/{coupon_\x24}/g, productData.coupon_amount || "")
                .replace(/{coupon_%}/g, productData.coupon_percent || "")
                .replace(/{dynamic_coupon}/g, productData.dynamic_coupon || "")
                .replace(/{promo_code}/g, productData.promo_code || "")
                .replace(/{promo_code_%}/g, productData.promo_code_percent_off || "")
                .replace(/{final_price}/g, productData.final_price || "");
        }

        return preview;
    };

    const copyImageToClipboard = async (imageUrl: string) => {

        if (currentPlan !== "Pro Plan") {
            setPopupMessage("Upgrade to the Pro plan to copy images.");
            setPopupType('error');
            setIsPopupOpen(true);
            return;
        }

        try {
            const image = await convertJpgToPng(imageUrl);
            const response = await fetch(image);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob
                })
            ]);
            setImageCopied(true);
            setTimeout(() => setImageCopied(false), 2000);
        } catch (error) {
            setPopupMessage("Failed to copy image. Please try again.");
            setPopupType('error');
            setIsPopupOpen(true);
        }
    };

    const selectedTemplateData = templates.find(t => t.id === selectedTemplate);
    const hasProPlaceholders = checkForProPlaceholders(selectedTemplateData?.content);
    const showProAlert = currentPlan !== "Pro Plan" && hasProPlaceholders;

    return (
        <div className="bg-blue-100 h-full">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                <a href="https://affilitap.vercel.app" target="_blank" rel="noopener noreferrer">
                    <img src={logo} alt="logo" width={120} className="transform transition-transform duration-300 hover:scale-105" />
                </a>
                {isSettingsOpen ? (
                    <button
                        onClick={handleBack}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                ) : (
                    <button
                        onClick={handleOpenSettings}
                        className="border-solid border-2 border-black bg-gray-100 text-gray-800 font-semibold p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center justify-center"
                    >
                        <SettingsIcon className="h-4 w-4" />
                    </button>
                )}
            </div>
            <div className="p-3">
                <div className="flex flex-col items-center space-y-5">
                    {isSettingsOpen ? (
                        <>
                            <Settings
                                onLicenseUpdate={({ licenseStatus, currentPlan }) => {
                                    setLicenseStatus(licenseStatus);
                                    setCurrentPlan(currentPlan);
                                }}
                            />
                        </>
                    ) : (
                        <>
                            <LicenseStatusHeader />

                            <button
                                onClick={handleAddTemplate}
                                className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center justify-center group"
                            >
                                <Plus className="mr-2 h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
                                Create New Template
                            </button>

                            <div className="relative">
                                {/* Select Label and Control Container */}
                                <div className="flex items-center gap-4">
                                    <label htmlFor="template-select" className="text-gray-700 font-medium whitespace-nowrap text-lg">
                                        Select template:
                                    </label>

                                    {/* Floating Label Style Select */}
                                    <div className="relative flex items-center flex-1">
                                        <div className="relative flex-1">
                                            <select
                                                id="template-select"
                                                value={selectedTemplate}
                                                onChange={handleTemplateChange}
                                                className="w-full appearance-none pl-10 pr-10 py-2.5 bg-white 
                            text-gray-700 border border-gray-200 rounded-lg
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                            transition-all duration-200 hover:border-gray-300"
                                                aria-label="Select template"
                                            >
                                                {templates.length > 0 ? (
                                                    templates.map((template) => (
                                                        <option key={template.id} value={template.id}>
                                                            {template.name} {template.isDefault && '(Default)'}
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option disabled>No templates available</option>
                                                )}
                                            </select>

                                            {/* Template Icon */}
                                            <Layers3 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />

                                            {/* Dropdown Icon */}
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Empty State Message - Only shown when no templates */}
                                {templates.length === 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2">
                                        <div className="flex items-center justify-center p-2 bg-gray-50 
                                rounded-lg border border-gray-200 text-gray-500 text-sm">
                                            <AlertCircle className="mr-1.5 h-4 w-4" />
                                            No templates available
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Post Preview */}
                            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">

                                {/* Header Section */}
                                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-blue-600">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Eye className="h-5 w-5 text-white" />
                                            <h2 className="text-lg font-semibold text-white">Post Preview</h2>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 space-y-4">
                                    {/* Pro Plan Alert */}
                                    {showProAlert && (
                                        <div className="flex items-start p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                            <div className="ml-3">
                                                <p className="text-sm text-amber-800">
                                                    This template contains Pro-only placeholders.{' '}
                                                    <button
                                                        onClick={handleBillingRedirect}
                                                        className="font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:underline transition-colors"
                                                    >
                                                        Upgrade to unlock
                                                    </button>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tracking ID Badge */}
                                    {selectedTemplateData?.trackingId && (
                                        <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                                            <Hash className="h-4 w-4 text-gray-500" />
                                            <span className="font-medium">Tracking ID:</span>
                                            <code className="px-2 py-0.5 bg-white rounded border border-gray-200">
                                                {selectedTemplateData.trackingId}
                                            </code>
                                        </div>
                                    )}

                                    {/* Preview Content */}
                                    <div className="relative">
                                        <div className="bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="px-4 py-3 border-b border-gray-200 bg-gray-100/50">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-600">Content</span>
                                                    <button
                                                        onClick={() => copyToClipboard(previewText)}
                                                        className={`
                    inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium
                    transition-all duration-200
                    ${copied
                                                                ? 'bg-green-50 text-green-600 border border-green-200'
                                                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                                            }
                    disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500
                  `}
                                                    >
                                                        {copied ? (
                                                            <>
                                                                <CheckCircle className="h-4 w-4 mr-1.5" />
                                                                Copied!
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="h-4 w-4 mr-1.5" />
                                                                Copy
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                                                    {previewText}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <ProductImageCard
                                productData={productData}
                                currentPlan={currentPlan}
                                copyImageToClipboard={copyImageToClipboard}
                                imageCopied={imageCopied}
                            />
                        </>
                    )}
                </div>

                {/* Having trouble with data card */}
                <HelpCard />

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
