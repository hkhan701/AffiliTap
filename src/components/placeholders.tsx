import { useState } from 'react'
import { Copy, HelpCircle, CheckCircle } from 'lucide-react'

// @ts-ignore
import discount_percentage from 'src/assets/images/discount_percentage.png'; // @ts-ignore
import current_price from 'src/assets/images/current_price.png'; // @ts-ignore
import list_price from 'src/assets/images/list_price.png'; // @ts-ignore
import coupon_amount from 'src/assets/images/coupon_amount.png'; // @ts-ignore
import coupon_percentage from 'src/assets/images/coupon_percentage.png';  // @ts-ignore
import promo_code from 'src/assets/images/promo_code.png'; // @ts-ignore
import promo_code_percentage from 'src/assets/images/promo_code_percentage.png'; // @ts-ignore
import checkout_discount from 'src/assets/images/checkout_discount.png';


export default function Placeholders() {
    const [copiedPlaceholder, setCopiedPlaceholder] = useState<string | null>(null)

    const placeholders: {
        key: string
        description: string
        image?: string
    }[] = [
            { key: '{product_name}', description: 'Product name' },
            { key: '{current_price}', description: 'Price without coupons or promo codes', image: current_price },
            { key: '{list_price}', description: 'Original price of the product', image: list_price },
            { key: '{discount_percentage}', description: 'Discount percentage', image: discount_percentage },
            { key: '{coupon_$}', description: 'Coupon dollar amount off', image: coupon_amount },
            { key: '{coupon_%}', description: 'Coupon percentage off', image: coupon_percentage },
            { key: '{dynamic_coupon}', description: 'Dynamic coupon populates either {coupon_$} or {coupon_%} based on what exists' },
            { key: '{promo_code}', description: 'Promo code (e.g., "HJY10OPF")', image: promo_code },
            { key: '{promo_code_%}', description: 'Percentage off of the promo code', image: promo_code_percentage },
            { key: '{checkout_discount_$}', description: 'Discount amount applied automatically at checkout', image: checkout_discount },
            { key: '{checkout_discount_%}', description: 'Discount percentage off applied automatically at checkout', image: checkout_discount },
            { key: '{dynamic_checkout_discount}', description: 'Dynamic checkout discount populates either {checkout_discount_$} or {checkout_discount_%} based on what exists', image: checkout_discount },
            { key: '{final_price}', description: 'Price calculated after coupons and promo codes' },
            { key: '{rating}', description: 'Rating of the product out of 5 stars' },
            { key: '{amz_link}', description: 'Your Amazon affiliate link for the product (based on your link type setting)' }]

    const handleCopyPlaceholder = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedPlaceholder(key);
        setTimeout(() => setCopiedPlaceholder(null), 2000);
    }

    return (
        <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md">
            <div className="px-6 py-4 bg-blue-100 border-b border-blue-200 rounded-t-xl">
                <h2 className="text-xl font-semibold text-blue-800">Placeholders</h2>
            </div>
            <div className="p-6 space-y-6">
                {placeholders.map(({ key, description, image }) => (
                    <div key={key} className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <p className="font-mono text-sm text-gray-700">{key}</p>
                                {image && (
                                    <div className="relative group">
                                        <div
                                            className="text-blue-500 hover:text-blue-700 cursor-help"
                                            aria-label="Show image tooltip"
                                        >
                                            <HelpCircle size={16} />
                                        </div>
                                        {/* Tooltip */}
                                        <div className="absolute left-1/2 -translate-x-1/2 top-10 z-20 hidden group-hover:flex flex-col w-72 p-2 bg-white rounded-md shadow-lg">
                                            <img
                                                src={image}
                                                alt={description}
                                                className="w-full h-auto rounded"
                                            />
                                            <p className="mt-2 text-xs text-gray-500">{description}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => handleCopyPlaceholder(key)}
                                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                                    ${copiedPlaceholder === key
                                        ? 'bg-green-50 text-green-600 border border-green-200'
                                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                    }
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500
                                `}
                            >
                                {copiedPlaceholder === key ? (
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
                        <p className="text-xs text-gray-500">{description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}