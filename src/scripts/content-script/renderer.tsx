import { useState, useEffect } from "react"
import { renderer } from "@/lib/renderer"
import { browser } from "webextension-polyfill-ts"

import "../../globals.css"
import { get } from "http"

const containerId = "chrome-extension-boilerplate-container-id"
const containerClassName = "chrome-extension-boilerplate-container-class"
const tag = "chrome-extension-boilerplate-container"

type ProductData = {
  product_name: string | null;
  current_price: number | null;
  list_price: string | null;
  percent_off_list_price: string | null;
};

type Selectors = {
  product_name: string;
  price_ca_whole: string;
  price_ca_fraction: string;
  list_price: string;
  percent_off_list_price: string;
};

const selectors: Selectors = {
  product_name: "span#productTitle",
  price_ca_whole: "span.a-price-whole",
  price_ca_fraction: "span.a-price-fraction",
  list_price: 'span.a-price.a-text-price[data-a-size="s"][data-a-strike="true"][data-a-color="secondary"] > span.a-offscreen',
  percent_off_list_price: 'span.savingPriceOverride.reinventPriceSavingsPercentageMargin.savingsPercentage',
};

const data: Record<string, string | null> = {
  product_name: null,
  price_ca_whole: null,
  price_ca_fraction: null,
  list_price: null,
  percent_off_list_price: null,
};

function App() {
  const getProductData = () => {

    // Populate data object using selectors
    for (const [key, selector] of Object.entries(selectors) as [keyof Selectors, string][]) {
      const element = document.querySelector(selector);
      data[key] = element ? element.textContent?.trim() || null : null;
    }

    const current_price = data.price_ca_whole && data.price_ca_fraction
    ? parseFloat(data.price_ca_whole.replace(/[^0-9.]/g, '')) +
      parseFloat(data.price_ca_fraction.replace(/[^0-9]/g, '')) / 100
    : null;

    const list_price = data.list_price ? data.list_price.replace(/[^0-9.]/g, '') : null;
    const percent_off_list_price = data.percent_off_list_price ? data.percent_off_list_price.replace('-', '').replace('%', '') : null;

      // Return structured data
      const productData = {
        product_name: data.product_name,
        current_price: current_price,
        list_price: list_price,
        percent_off_list_price: percent_off_list_price,
      };

      return productData;
  };

  // Please remove default_popup from manifest.json
  // And you can enable this code to open to communicate with content
  useEffect(() => {

    const data = getProductData();
    if (data) {
      console.log("Sending message:", data);
      browser.runtime.sendMessage({ action: "SEND_PRODUCT_DATA", data });
    }

    // Listen for messages from the background script
    browser.runtime.onMessage.addListener(async (message, sender) => {
      if (message.action === "REQUEST_PRODUCT_DATA") {
        const data = getProductData();
        return { data };
      }
    });

  }, []);

  return null
}

renderer(<App />, { tag, containerId, containerClassName })
