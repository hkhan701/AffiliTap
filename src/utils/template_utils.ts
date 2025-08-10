import { LinkType } from '@/utils/utils';
export interface Template {
    id: string;
    name: string;
    content: string;
    titleWordLimit: number;
    trackingId: string;
    isDefault: boolean;
    linkType: LinkType;
}

export const defaultPrompts = {
  'Promo Code': `🔥 Hot Deal Alert 🔥
{product_title}
Use code {promo_code} at checkout
{discount_percent}% OFF - Now only {final_price}
Reg: {list_price}

#ad
{affiliate_link}`,

  'Price Drop': `📉 Price Drop Alert 📉
{product_title}
Was: {list_price} -> Now: {final_price}
You save {discount_percentage}% 💸

Hurry before the price goes back up!
#ad
{affiliate_link}`,

  'Clip Coupon': `🎉 Limited Time Offer 🎉
Only {final_price}!
{product_title}

Save an extra {coupon} with clip-on coupon

#ad
{affiliate_link}`,

  'Checkout Discount': `💰 Extra Savings at Checkout 💰
{product_title}
Just {final_price} after {checkout_discount}% OFF at checkout
Reg Price: {list_price}

Discount auto-applies in cart – No code needed
#ad
{affiliate_link}`,

  'Custom Instructions': `After the main deal information and link, always add a personalized engaging question that relates to the product category along with a related emoji. 
Examples:
Gaming keyboard: Ready to level up your gaming setup? 🎮
Kitchen appliances: Ready to become a master chef in your own kitchen? 👩‍🍳
Fitness equipment: Ready to crush your fitness goals? 💪
Beauty products: Ready to glow up your skincare routine? ✨

Rewrite long product titles into short, concise titles of 3 to 6 words. Do not add extra explanation or formatting.`
};