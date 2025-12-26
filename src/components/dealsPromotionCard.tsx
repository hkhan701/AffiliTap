import { ExternalLink, Sparkles } from 'lucide-react';

const DealsPromotionCard = () => {
  return (
    <div className="w-full bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg border border-rose-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white animate-pulse" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-rose-900">
              Hard Time Finding Deals?
            </p>
            <p className="text-xs text-rose-700 pr-4">
              Discover the latest promo codes, discounts and coupons on thousands of Amazon products through{' '}
              <a
                href="https://dynamodealz.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-rose-800 hover:text-rose-900 underline hover:no-underline transition-all duration-200"
              >
                Dynamo Dealz
              </a>
              !
            </p>
          </div>
        </div>
        <a
          href="https://dynamodealz.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-rose-700 bg-white rounded-md border border-rose-300 hover:bg-rose-50 hover:border-rose-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1"
        >
          Visit
          <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      </div>
    </div>
  );
};

export default DealsPromotionCard;