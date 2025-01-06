import { useEffect } from "react"
import { renderer } from "@/lib/renderer"
import { browser } from "webextension-polyfill-ts"
import { modifyImageLink } from "@/utils/utils"

import "../../globals.css"

const containerId = "chrome-extension-boilerplate-container-id"
const containerClassName = "chrome-extension-boilerplate-container-class"
const tag = "chrome-extension-boilerplate-container"

type Selectors = {
  product_name: string;
  price_ca_whole: string;
  price_ca_fraction: string;
  current_price: string;
  list_price: string;
  percent_off_list_price: string;
  clip_coupon: string;
  promo_code: string;
  promo_code_percent_off: string;
  checkout_discount: string;
  rating: string;
  image_url: string;
};

const selectors: Selectors = {
  product_name: "span#productTitle",
  price_ca_whole: "span.a-price-whole",
  price_ca_fraction: "span.a-price-fraction",
  current_price: "#apex_offerDisplay_desktop .a-price .a-offscreen",
  list_price: 'span.a-price.a-text-price[data-a-size="s"][data-a-strike="true"][data-a-color="secondary"] > span.a-offscreen',
  percent_off_list_price: 'span.savingPriceOverride.reinventPriceSavingsPercentageMargin.savingsPercentage',
  clip_coupon: 'label[for*="checkboxpct"][id*="couponTextpctch"]',
  promo_code: 'span[id^="promoMessageCXCW"]',
  promo_code_percent_off: 'label[id^="greenBadgepctch"]',
  checkout_discount: '.a-box.a-alert-inline.a-alert-inline-success.a-text-bold .a-alert-content',
  rating: 'span[data-hook="rating-out-of-text"]',
  image_url: "div.imgTagWrapper img",
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

  const calculateFinalPrice = (
    currentPrice: number | null,
    couponAmount: number,
    couponPercent: number,
    promoCodePercentOff: number | null,
    checkoutDiscount: number | null
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

    // Subtract promo code discount
    discountedPrice -= promoCodeDiscount;

    // Add checkout discount percentage
    if (checkoutDiscount) {
      discountedPrice -= (checkoutDiscount / 100) * discountedPrice;
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
    return percentOff.toFixed(0);
  };

  const getProductData = () => {

    // Populate data object using selectors
    for (const [key, selector] of Object.entries(selectors) as [keyof Selectors, string][]) {
      const element = document.querySelector(selector);
      data[key] = element ? element.textContent?.trim() || null : null;
    }


    let current_price = null;
    const priceElement = document.querySelector(selectors.current_price);
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
    // const percent_off_list_price = data.percent_off_list_price ? data.percent_off_list_price.replace('-', '').replace('%', '') : null;
    const coupon_amount = data.clip_coupon ? parseFloat(data.clip_coupon.match(/\$([0-9.]+)/)?.[1] || '0') : 0;
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

    const promo_code_percent_off = data.promo_code_percent_off ? data.promo_code_percent_off.match(/(\d+)%/)[1] : null;
    const checkout_discount = data.checkout_discount ? data.checkout_discount.match(/(\d+)%/)[1] : null;
    const rating = data.rating ? parseFloat(data.rating.split(' ')[0]) : null;
    const imageElement = document.querySelector(selectors.image_url);
    const image_url = imageElement ? imageElement.getAttribute("src") : null;
    const updated_image_url = image_url ? modifyImageLink(image_url) : null;

    const final_price = calculateFinalPrice(
      current_price ? parseFloat(current_price) : null,
      coupon_amount,
      coupon_percent,
      promo_code_percent_off ? parseFloat(promo_code_percent_off) : null,
      checkout_discount ? parseFloat(checkout_discount) : null
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
      checkout_discount: checkout_discount,
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
