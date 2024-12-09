import { useState } from 'react'
import { Copy } from 'lucide-react'

export default function Placeholders({ isContentLocked = false } ) {
    const [copiedPlaceholder, setCopiedPlaceholder] = useState<string | null>(null);
    const placeholders: { key: string; description: string }[] = [
        { key: '{product_name}', description: 'Product name' },
        { key: '{current_price}', description: 'Price without coupons or promo codes' },
        { key: '{list_price}', description: 'Original price of the product' },
        { key: '{discount_percentage}', description: 'Discount percentage' },
        { key: '{coupon_$}', description: 'Coupon dollar amount off' },
        { key: '{coupon_%}', description: 'Coupon percentage off' },
        { key: '{dynamic_coupon}', description: 'Dynamic coupon populates either {coupon_$} or {coupon_%} based on what exists' },
        { key: '{promo_code}', description: 'Promo code (eg. "HJY10OPF")' },
        { key: '{promo_code_%}', description: 'Percentage off of the promo code' },
        { key: '{final_price}', description: 'Price calculated after coupons and promo codes' },
        { key: '{rating}', description: 'Rating of the product out of 5 stars' },
        { key: '{amz_link}', description: 'Amazon link of the product' },
    ]

    const handleCopyPlaceholder = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedPlaceholder(key);
        setTimeout(() => setCopiedPlaceholder(null), 2000);
    }

    return (
        <div className="w-72">
            <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
                <div className="px-4 py-3 bg-blue-100 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Placeholders</h2>
                </div>
                <div className="p-4">
                    <div className="space-y-3">
                        {placeholders.map(({ key, description }) => (
                            <div key={key} className="flex flex-col">
                                <div className="flex items-center justify-between">
                                    <p className="font-mono text-sm text-gray-700">{key}</p>
                                    <button
                                        onClick={() => handleCopyPlaceholder(key)}
                                        className={
                                            `px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${copiedPlaceholder === key ? 'animate-pulse text-green-500' : ''}`
                                        }
                                        disabled={isContentLocked}
                                    >
                                        <Copy className="inline-block mr-1 h-3 w-3" />
                                        {copiedPlaceholder === key ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
