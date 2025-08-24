import { useEffect } from "react"
import { renderer } from "@/lib/renderer"
import { browser } from "webextension-polyfill-ts"
import { modifyImageLink } from "@/utils/utils"

import "../../globals.css"

const containerId = "chrome-extension-boilerplate-container-id"
const containerClassName = "chrome-extension-boilerplate-container-class"
const tag = "chrome-extension-boilerplate-container"

type Selectors = {
  [key: string]: string[];
};


const selectors: Selectors = {
  product_name: ["span#productTitle"],
  price_ca_whole: ["span.a-price-whole"],
  price_ca_fraction: ["span.a-price-fraction"],
  current_price: ["#apex_offerDisplay_desktop .a-price .a-offscreen"],
  list_price: [
    'span.a-price.a-text-price[data-a-size="s"][data-a-strike="true"][data-a-color="secondary"] > span.a-offscreen'
  ],
  percent_off_list_price: [
    "span.savingPriceOverride.reinventPriceSavingsPercentageMargin.savingsPercentage"
  ],
  clip_coupon: [
    "label.ct-coupon-checkbox-label .ct-coupon-tile-price-content .a-offscreen",
    "span.couponLabelText",
    "label[for*='checkboxpct'][id*='couponTextpctch']"
  ],
  promo_code: ["span[id^='promoMessageCXCW']"],
  promo_code_percent_off: ["label[id^='greenBadgepctch']"],
  checkout_discount: [".a-box.a-alert-inline.a-alert-inline-success.a-text-bold .a-alert-content"],
  rating: ['span[data-hook="rating-out-of-text"]'],
  image_url: ["div.imgTagWrapper img"],
};

const data: Record<string, string | null> = {
  product_name: null,
  price_ca_whole: null,
  price_ca_fraction: null,
  list_price: null,
  percent_off_list_price: null,
  clip_coupon: null,
  promo_code: null,
  promo_code_percent_off: null,
  checkout_discount: null,
  rating: null,
};

function App() {

  function getDynamicCoupon(coupon_amount: number, coupon_percent: number): string | null {
    if (coupon_amount > 0) {
      return `$${coupon_amount}`;
    } else if (coupon_percent > 0) {
      return `${coupon_percent}%`;
    } else {
      return null;
    }
  }

  function getDynamicCheckoutDiscount(checkout_discount: number | null, checkout_discount_amount: number | null): string | null {
    if (checkout_discount) {
      return `${checkout_discount}% off`;
    } else if (checkout_discount_amount) {
      return `$${checkout_discount_amount} off`;
    } else {
      return null;
    }
  }

  const calculateFinalPrice = (
    currentPrice: number | null,
    couponAmount: number,
    couponPercent: number,
    promoCode: string | null,
    promoCodePercentOff: number | null,
    checkoutDiscount: number | null,
    checkoutDiscountAmount: number | null
  ) => {
    if (!currentPrice) return null;

    // Print out all the parameters
    // console.log("currentPrice", currentPrice);
    // console.log("couponAmount", couponAmount);
    // console.log("couponPercent", couponPercent);
    // console.log("promoCodePercentOff", promoCodePercentOff);

    let discountedPrice = currentPrice;

    // Apply either coupon amount or coupon percent (never both)
    if (couponAmount > 0) {
      discountedPrice -= couponAmount; // Fixed amount off
    } else if (couponPercent > 0) {
      discountedPrice -= (couponPercent / 100) * discountedPrice; // Percentage off
    }

    // console.log("price after coupons ", discountedPrice);

    // Apply promo code discount based on original current price
    const promoCodeDiscount = promoCodePercentOff
      ? (promoCodePercentOff / 100) * currentPrice
      : 0;
    // console.log("Promo code discount", promoCodeDiscount);

    // Subtract promo code discount only if promo code exists
    // This handles cases where it is "Save X% on any 5"
    if (promoCode) {
      discountedPrice -= promoCodeDiscount;
    }

    // Add checkout discount percentage
    if (checkoutDiscount) {
      discountedPrice -= (checkoutDiscount / 100) * discountedPrice;
    }

    // Add checkout discount amount
    if (checkoutDiscountAmount) {
      discountedPrice -= checkoutDiscountAmount;
    }

    // Ensure the price is not negative
    return Math.max(discountedPrice, 0).toFixed(2);
  };

  const extractPromoCode = (text: string) => {
    if (!text) {
      return null;
    }
    const promoCodeMatch = text.match(/promo code: (.*)/);
    if (promoCodeMatch) {
      return promoCodeMatch[1].split(' ')[0].trim();
    } else {
      return null;
    }
  }

  const calculatePercentOffListPrice = (listPrice: string, currentPrice: string) => {
    if (!listPrice || !currentPrice) {
      return null;
    }

    const listPriceValue = parseFloat(listPrice);
    const currentPriceValue = parseFloat(currentPrice);

    if (listPrice === currentPrice) {
      return null;
    }

    const percentOff = ((listPriceValue - currentPriceValue) / listPriceValue) * 100;
    // return null if percentOff is 0
    if (percentOff === 0) {
      return null;
    }
    return percentOff.toFixed(0);
  };

  const calculateCouponAmount = (clipCouponText: string | null, currentPrice: number | null): number => {
    if (!clipCouponText) return 0;

    // Special case: Check for "Coupon price" text separately
    const couponTextElement = document.querySelector("label.ct-coupon-checkbox-label .ct-coupon-tile-text-content .a-text-normal span");
    const couponTextContent = couponTextElement?.textContent?.trim().toLowerCase();

    if (couponTextContent?.includes('coupon price')) {
      // Get the price from the existing clip_coupon data (which should contain the price)
      const couponPriceMatch = clipCouponText.match(/\$([0-9.]+)/);
      if (couponPriceMatch && currentPrice) {
        const couponPrice = parseFloat(couponPriceMatch[1]);
        return parseFloat((parseFloat(currentPrice.toString()) - couponPrice).toFixed(2));
      }
    } else {
      // Original logic for direct discount amounts
      const directDiscountMatch = clipCouponText.match(/\$([0-9.]+)/);
      if (directDiscountMatch) {
        return parseFloat(directDiscountMatch[1]);
      }
    }

    return 0;
  };

  const getProductData = () => {

    // Populate data object using selectors
    for (const [key, selectorList] of Object.entries(selectors)) {
      let value: string | null = null;
      for (const sel of selectorList) {
        const el = document.querySelector(sel);
        if (el && el.textContent?.trim()) {
          value = el.textContent.trim();
          break;
        }
      }
      data[key] = value;
    }


    let current_price = null;
    const priceElement = document.querySelector(selectors.current_price[0]);
    if (priceElement) {
      // Extract the price from the innerHTML, removing any currency symbol at the start
      const priceString = priceElement.innerHTML.replace(/[^0-9.]/g, '');
      current_price = parseFloat(parseFloat(priceString).toFixed(2));
    } else {
      current_price = data.price_ca_whole && data.price_ca_fraction
        ? (parseFloat(data.price_ca_whole.replace(/[^0-9.]/g, '')) + parseFloat(data.price_ca_fraction.replace(/[^0-9]/g, '')) / 100).toFixed(2)
        : null;
    }

    const list_price = data.list_price ? data.list_price.replace(/[^0-9.]/g, '') : null;
    const percent_off_list_price = calculatePercentOffListPrice(list_price || '', current_price || '');
    const coupon_amount = calculateCouponAmount(data.clip_coupon, current_price ? parseFloat(current_price.toString()) : null);
    const coupon_percent = data.clip_coupon ? parseFloat(data.clip_coupon.match(/([0-9.]+)%/)?.[1] || '0') : 0;
    const promo_code = extractPromoCode(data.promo_code);

    // const promo_code_id = parseInt(document.querySelector(selectors.promo_code)?.id.match(/\d+/g)?.toString() || '', 10);

    // const all_promo_code_percent_off = document.querySelectorAll(selectors.promo_code_percent_off);
    // // Find the element directly by matching its id
    // const matchingElement = Array.from(all_promo_code_percent_off).find(
    //   (element) => {
    //     const id = parseInt(element.id.match(/\d+/g)?.toString() || '', 10);
    //     return id === promo_code_id;
    //   }
    // );

    const promo_code_percent_off = data.promo_code_percent_off
      ? (data.promo_code_percent_off.match(/(\d+)%/) ? data.promo_code_percent_off.match(/(\d+)%/)[1] : null)
      : null;
    const checkout_discount_percent = data.checkout_discount ? data.checkout_discount.match(/(\d+)%/)?.[1] : null;
    const checkout_discount_amount = data.checkout_discount ? data.checkout_discount.match(/\$([0-9.]+)/)?.[1] : null;
    const rating = data.rating ? parseFloat(data.rating.split(' ')[0]) : null;
    const imageElement = document.querySelector(selectors.image_url[0]);
    const image_url = imageElement ? imageElement.getAttribute("src") : null;
    const updated_image_url = image_url ? modifyImageLink(image_url) : null;

    const final_price = calculateFinalPrice(
      current_price ? parseFloat(current_price) : null,
      coupon_amount,
      coupon_percent,
      promo_code,
      promo_code_percent_off ? parseFloat(promo_code_percent_off) : null,
      checkout_discount_percent ? parseFloat(checkout_discount_percent) : null,
      checkout_discount_amount ? parseFloat(checkout_discount_amount) : null
    );


    // Return structured data
    const productData = {
      product_name: data.product_name,
      current_price: current_price,
      list_price: list_price,
      percent_off_list_price: percent_off_list_price,
      coupon_amount: coupon_amount,
      coupon_percent: coupon_percent,
      dynamic_coupon: getDynamicCoupon(coupon_amount, coupon_percent),
      promo_code: promo_code,
      promo_code_percent_off: promo_code_percent_off,
      checkout_discount_percent: checkout_discount_percent,
      checkout_discount_amount: checkout_discount_amount,
      dynamic_checkout_discount: getDynamicCheckoutDiscount(parseFloat(checkout_discount_percent || '') || null, parseFloat(checkout_discount_amount || '') || null), // Use parseFloat to convert strings to numberscheckout_discount_percent, checkout_discount_amount),
      final_price: final_price,
      rating: rating,
      image_url: updated_image_url
    };

    return productData;
  };

  // Please remove default_popup from manifest.json
  // And you can enable this code to open to communicate with content
  useEffect(() => {

    const initialData = getProductData();
    if (initialData.product_name) {
      try {
        browser.runtime.sendMessage({ action: "SEND_PRODUCT_DATA", data: initialData });
      }
      catch (error) {
        console.log("Unable to send product data, side panel not open");
      }
    }

    // Listen for messages from the background script to retrieve product data on demand
    browser.runtime.onMessage.addListener((message) => {
      if (message.action === "REQUEST_PRODUCT_DATA") {
        try {
          const data = getProductData();
          if (data) {
            browser.runtime.sendMessage({ action: "SEND_PRODUCT_DATA", data });
          }
        } catch (error) {
          console.log("Unable to send product data, side panel not open");
        }
      }
    });

  }, []);

  return (<></>);
}

renderer(<App />, { tag, containerId, containerClassName })
