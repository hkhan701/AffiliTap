import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { browser } from "webextension-polyfill-ts";
import { handleAddTemplate, getLinkByType, shortenProductName, convertJpgToPng, getAiGeneratedTitle, getAiGeneratedPost } from "@/utils/utils";
import { Template } from "@/utils/template_utils";
import { browserStorage } from "@/utils/browserStorage";
import { Plus, Hash, CheckCircle, Copy, AlertCircle, ChevronDown, Sparkles, Link } from 'lucide-react';
// @ts-ignore
import logo from 'src/assets/images/logo.svg';

import InfoPopup from '../../components/infoPopup';
import HelpCard from "../../components/helpCard";
import ProductImageCard from "@/components/productImageCard";

import "../../globals.css";
import DealsPromotionCard from "../../components/deals-promotion-card";


export default function SidePanel() {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [popupType, setPopupType] = useState<'success' | 'error'>('success');
    const [productData, setProductData] = useState(null);
    const [copied, setCopied] = useState(false)
    const [imageCopied, setImageCopied] = useState(false);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("");
    const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
    const [isGeneratingPost, setIsGeneratingPost] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [remainingUsage, setRemainingUsage] = useState<number | null>(null);
    const [previewText, setPreviewText] = useState<string>("");
    const isSettingsOpen = false; // Placeholder for settings state

    const handleClosePopup = () => setIsPopupOpen(false);

    const fetchTemplates = async () => {
        const storedTemplates = await browserStorage.get('templates');
        if (storedTemplates) {
            const templatesData = JSON.parse(storedTemplates);
            // Ensure all templates have a linkType (default to 'amazon' for backward compatibility)
            const updatedTemplates = templatesData.map(template => ({
                ...template,
                linkType: template.linkType || 'amazon'
            }));
            setTemplates(updatedTemplates);

            // Save the updated templates back to storage
            await browserStorage.set('templates', JSON.stringify(updatedTemplates));

            const defaultTemplate = updatedTemplates.find(t => t.isDefault) || updatedTemplates[0];
            if (defaultTemplate) {
                setSelectedTemplate(defaultTemplate.id);
            }
        }
    };

    const handleTemplateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedTemplate(event.target.value);
    };

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

    const handleProductDataUpdate = ({ action, data }: { action: string; data: any; }) =>
        action === "UPDATE_PRODUCT_DATA" && setProductData(data);

    useEffect(() => {
        fetchProductData();
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

    function processTemplate(template: string, replacements: { [key: string]: string | undefined }): string {
        // Function to handle {if:key}...{/if} blocks
        function processConditionals(template: string): string {
            const lines = template.split("\n");
            const processedLines = lines.map((line) => {
                // Find all conditionals in the line
                const conditionalRegex = /{if:([^}]+)}(.*?){\/if}/g;
                let match;
                let newLine = line;
                let hasContent = false;

                while ((match = conditionalRegex.exec(line)) !== null) {
                    const [fullMatch, key, content] = match;
                    if (replacements[key]) {
                        // Replace the conditional with its content
                        newLine = newLine.replace(fullMatch, content.trim());
                        hasContent = true;
                    } else {
                        // Remove the entire conditional
                        newLine = newLine.replace(fullMatch, "");
                    }
                }
                // If the line had conditionals and is now empty, return null to remove it
                return line.includes("{if:") && !hasContent ? null : newLine;
            });

            // Filter out null lines and join the result
            return processedLines.filter((line) => line !== null).join("\n");
        }

        // First, process the conditionals
        let processedTemplate = processConditionals(template);

        // Then, replace the remaining placeholders with the actual data
        processedTemplate = processedTemplate.replace(
            /{([^}]+)}/g,
            (_, key) => replacements[key] || _
        );

        // Remove any triple (or more) newlines that might have been created
        processedTemplate = processedTemplate.replace(/\n{3,}/g, "\n\n");

        return processedTemplate.trim();
    }

    const generatePreviewText = async (templateContent: string, overrideTitle?: string): Promise<string> => {
        if (!productData) return "No product data available. Loading...";

        const currentTemplate = templates.find(t => t.id === selectedTemplate);
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const currentUrl = tabs[0]?.url || '';
        const amz_link = await getLinkByType(currentUrl, currentTemplate?.linkType || 'amazon', currentTemplate?.trackingId);
        const limitedTitle = overrideTitle ? overrideTitle : shortenProductName(productData.product_name, currentTemplate?.titleWordLimit);

        // Define placeholder replacements
        const replacements: { [key: string]: string | undefined } = {
            product_name: limitedTitle,
            current_price: productData.current_price,
            list_price: productData.list_price,
            discount_percentage: productData.percent_off_list_price,
            rating: productData.rating,
            amz_link: amz_link,
        };

        Object.assign(replacements, {
            "coupon_\x24": productData.coupon_amount,
            "coupon_%": productData.coupon_percent,
            dynamic_coupon: productData.dynamic_coupon,
            promo_code: productData.promo_code,
            "promo_code_%": productData.promo_code_percent_off,
            "checkout_discount_\x24": productData.checkout_discount_amount,
            "checkout_discount_%": productData.checkout_discount_percent,
            "dynamic_checkout_discount": productData.dynamic_checkout_discount,
            final_price: productData.final_price,
        });

        let preview = processTemplate(templateContent, replacements);

        // Replace coupon placeholder since it's a special case
        preview = preview.replace(/{coupon_\x24}/g, productData.coupon_amount || "")
            .replace(/{checkout_discount\x24}/g, productData.checkout_discount_amount || "")

        preview = preview
            .replace(/{product_name}/g, limitedTitle || "")
            .replace(/{current_price}/g, productData.current_price || "")
            .replace(/{list_price}/g, productData.list_price || "")
            .replace(/{discount_percentage}/g, productData.percent_off_list_price || "")
            .replace(/{rating}/g, productData.rating || "")
            .replace(/{amz_link}/g, amz_link || "")
            .replace(/{coupon_\x24}/g, productData.coupon_amount || "")
            .replace(/{coupon_%}/g, productData.coupon_percent || "")
            .replace(/{dynamic_coupon}/g, productData.dynamic_coupon || "")
            .replace(/{promo_code}/g, productData.promo_code || "")
            .replace(/{promo_code_%}/g, productData.promo_code_percent_off || "")
            .replace(/{checkout_discount_\x24}/g, productData.checkout_discount_amount || "")
            .replace(/{checkout_discount_%}/g, productData.checkout_discount_percent || "")
            .replace(/{dynamic_checkout_discount}/g, productData.dynamic_checkout_discount || "")
            .replace(/{final_price}/g, productData.final_price || "");

        return preview;
    };

    const copyImageToClipboard = async (imageUrl: string) => {
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



    const handleAiReplaceTitle = async () => {
        if (!productData?.product_name) return;

        setIsGeneratingTitle(true);
        setAiError(null);

        try {
            const result = await getAiGeneratedTitle(productData.product_name);
            if (!result || !result.short_title) throw new Error("No title returned");

            setRemainingUsage(result.remaining);

            const selectedTemplateContent = templates.find(t => t.id === selectedTemplate)?.content || "";
            const newPreview = await generatePreviewText(selectedTemplateContent, result.short_title);
            setPreviewText(newPreview);
        } catch (error) {
            setAiError(error instanceof Error ? error.message : "Failed to generate title");
        } finally {
            setIsGeneratingTitle(false);
        }
    };

    const handleAiReplacePost = async () => {
        if (!productData?.product_name) return;

        setIsGeneratingPost(true);
        setAiError(null);

        try {
            // Get the affiliate link like in generatePreviewText
            const currentTemplate = templates.find(t => t.id === selectedTemplate);
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            const currentUrl = tabs[0]?.url || '';
            const affiliate_link = await getLinkByType(currentUrl, currentTemplate?.linkType || 'amazon', currentTemplate?.trackingId);

            // Modify product data by removing dynamic fields and adding affiliate link
            const modifiedProductData = {
                ...productData,
                affiliate_link: affiliate_link,
                // Remove dynamic fields
                dynamic_coupon: undefined,
                dynamic_checkout_discount: undefined
            };

            // Remove undefined properties to clean up the object
            const cleanedProductData = Object.fromEntries(
                Object.entries(modifiedProductData).filter(([_, value]) => value !== undefined)
            );

            const result = await getAiGeneratedPost(JSON.stringify(cleanedProductData));
            if (!result || !result.post) throw new Error("No post returned");

            setRemainingUsage(result.remaining);
            setPreviewText(result.post);
        } catch (error) {
            setAiError(error instanceof Error ? error.message : "Failed to generate post");
        } finally {
            setIsGeneratingPost(false);
        }
    };

    const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

    return (
        <div className="bg-blue-100 h-full">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                <a href="https://affilitap.vercel.app" target="_blank" rel="noopener noreferrer">
                    <img src={logo} alt="logo" width={120} className="transform transition-transform duration-300 hover:scale-105" />
                </a>
                {/* {isSettingsOpen ? (
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
                )} */}
            </div>
            <div className="p-3">
                <div className="flex flex-col items-center space-y-5">
                    {isSettingsOpen ? (
                        <>
                            {/* <Settings
                                onLicenseUpdate={({ licenseStatus, currentPlan }) => {
                                    setLicenseStatus(licenseStatus);
                                    setCurrentPlan(currentPlan);
                                }}
                            /> */}
                        </>
                    ) : (
                        <>
                            <DealsPromotionCard />

                            <button
                                onClick={handleAddTemplate}
                                className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center justify-center group"
                            >
                                <Plus className="mr-2 h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
                                Create New Template
                            </button>

                            <div className="relative">

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
                                <div className="p-4 border-b border-gray-100 bg-blue-500">
                                    <div className="relative">
                                        {/* Select Label and Control Container */}
                                        <div className="flex items-center gap-4">
                                            <label htmlFor="template-select" className="text-white font-medium whitespace-nowrap text-lg">
                                                Select template:
                                            </label>

                                            {/* Floating Label Style Select */}
                                            <div className="relative flex items-center flex-1">
                                                <div className="relative flex-1">
                                                    <select
                                                        id="template-select"
                                                        value={selectedTemplate}
                                                        onChange={handleTemplateChange}
                                                        className="w-full appearance-none pl-2 pr-10 py-2.5 bg-white 
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
                                                    {/* <Layers3 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /> */}

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
                                </div>

                                <div className="p-4 space-y-4">

                                    {/* Tracking ID and Link Type Badges */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

                                        {/* Link Type Badge */}
                                        {selectedTemplateData?.linkType && (
                                            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                                                <Link className="h-4 w-4 text-gray-500" />
                                                <span className="font-medium">Link Type:</span>
                                                <code className="px-2 py-0.5 bg-white rounded border border-gray-200">
                                                    {selectedTemplateData.linkType}
                                                </code>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleAiReplaceTitle}
                                                disabled={isGeneratingTitle || !productData}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-md transition border ring-2 ring-purple-500
        ${isGeneratingTitle ? "bg-purple-300" : "bg-purple-100 hover:bg-purple-200"}
        text-purple-800 font-medium shadow-sm disabled:opacity-50`}
                                            >
                                                <Sparkles className="h-5 w-5" />
                                                {isGeneratingTitle ? "Generating..." : "Generate Short AI Title"}
                                            </button>

                                            <button
                                                disabled={isGeneratingPost || !productData}
                                                onClick={() => { handleAiReplacePost() }}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-md transition border ring-2 ring-purple-500
        ${isGeneratingPost ? "bg-purple-300" : "bg-purple-100 hover:bg-purple-200"}
        text-purple-800 font-medium shadow-sm disabled:opacity-50`}
                                            >
                                                <Sparkles className="h-5 w-5" />
                                                {isGeneratingPost ? "Generating..." : "Generate AI Post"}
                                            </button>


                                        </div>
                                        {aiError && (
                                            <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                                                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                                <div className="text-sm text-red-800">
                                                    <p className="font-medium mb-1">Error</p>
                                                    <p>{aiError}</p>
                                                </div>
                                            </div>
                                        )}

                                        {remainingUsage !== null && (
                                            <div className="bg-gray-50 rounded-lg p-3 border">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Daily AI Usage
                                                    </span>
                                                    <span className="text-sm text-gray-600">
                                                        {remainingUsage}/100 remaining
                                                    </span>
                                                </div>

                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className={`h-2.5 rounded-full transition-all duration-500 ${remainingUsage > 50
                                                            ? 'bg-green-500'
                                                            : remainingUsage > 20
                                                                ? 'bg-yellow-500'
                                                                : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${(remainingUsage / 100) * 100}%` }}
                                                    />
                                                </div>

                                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                    <span>0</span>
                                                    <span>50</span>
                                                    <span>100</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Preview Content */}
                                    <div className="relative">
                                        <div className="bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="px-4 py-3 border-b border-gray-200 bg-gray-100/50">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-600">Post Preview</span>
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
