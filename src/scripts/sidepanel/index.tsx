import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { FaCopy, FaInfoCircle } from "react-icons/fa";
import { browser } from "webextension-polyfill-ts";
import { getLicenseStatus, getCurrentPlan } from "@/utils/license";
import { Settings as SettingsIcon, Plus, ArrowLeft } from 'lucide-react';
import { handlePurchaseRedirect, handleAddTemplate, getShortUrl, shortenProductName, convertJpgToPng, handleBillingRedirect } from "@/utils/utils";
import { browserStorage } from "@/utils/browserStorage";
import InfoPopup from '../../components/infoPopup';
import LicenseStatusHeader from "../../components/licenseStatusHeader";
import ContentLockOverlay from "../../components/contentLockOverlay";
import InfoCard from "../../components/infocard";
// @ts-ignore
import logo from 'src/assets/images/logo.svg';

import "../../globals.css";
import Settings from "./settings";
import ProductImageCard from "@/components/productImageCard";

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
                .replace(/{promo_code}/g, productData.promo_code || "")
                .replace(/{promo_code_%}/g, productData.promo_code_percent_off || "");
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
                                className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center justify-center"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create New Template
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
                                                {template.name} {template.isDefault ? '(Default)' : ''}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>No templates available</option>
                                    )}
                                </select>
                            </div>

                            {/* Post Preview */}
                            <div className="w-full bg-white rounded-lg shadow-md p-4 relative">
                                <ContentLockOverlay isContentLocked={isContentLocked} />
                                <h2 className="text-lg font-semibold mb-2">Post Preview</h2>
                                {/* Reminder for Pro-only placeholders */}
                                {currentPlan !== "Pro Plan" && checkForProPlaceholders(templates.find(t => t.id === selectedTemplate)?.content) && (
                                    <div className="mb-4 p-3 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-800 flex items-center">
                                        <FaInfoCircle className="mr-2" />
                                        <span>You have used placeholders that are only available in the Pro plan. <button onClick={handleBillingRedirect} className="text-blue-600 underline">Upgrade to unlock</button>.</span>
                                    </div>
                                )}
                                {templates.find(t => t.id === selectedTemplate)?.trackingId && (
                                    <p className="text-sm text-gray-600 mb-2">
                                        <strong>Current Tracking ID:</strong> {templates.find(t => t.id === selectedTemplate)?.trackingId}
                                    </p>
                                )}
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
                <InfoCard />

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
