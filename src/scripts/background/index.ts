/* eslint-disable no-console */
import { browser } from "webextension-polyfill-ts"
import { verifyLicenseKey } from "@/utils/license";
import { get } from "http";

browser.runtime.onInstalled.addListener((): void => { 
  console.log('AffiliTap is installed!');
})

browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'CHECK-LICENSE') {
    console.log('Checking if there is a valid license...');
    await verifyLicenseKey();
  }
});

browser.alarms.create('CHECK-LICENSE', {
  when: Date.now() + 10,
  periodInMinutes: 1,
}) // validate license every 30 mins

// Listen for product data updates from the content script
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "SEND_PRODUCT_DATA") {
    console.log("Received product data from content script:", message.data);
    // Notify the side panel of the updated product data
    browser.runtime.sendMessage({ action: "UPDATE_PRODUCT_DATA", data: message.data });
  }
});

// Handle tab switching to retrieve product data on Amazon product pages
browser.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await browser.tabs.get(activeInfo.tabId);
  const tabId = activeInfo.tabId

  await browser.scripting.executeScript({
    target: { tabId },
    files: ["content.js"]
  });

  // Check if the active tab URL is an Amazon product page
  if (tab.url && (tab.url.includes("amazon.ca") || tab.url.includes("amazon.com"))) {
    try {
      // Request product data from the content script in the active tab
      const response = await browser.tabs.sendMessage(tab.id, { action: "REQUEST_PRODUCT_DATA" });

      // Notify the side panel of the updated product data
      browser.runtime.sendMessage({ action: "UPDATE_PRODUCT_DATA", data: response.data });
    } catch (error) {
      console.error("Failed to fetch product data:", error);
    }
  }
});


// Workaround for sidePanel typing issue
const sidePanel = (browser as any).sidePanel;
sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Please remove default_popup from manifest.json
// And you can enable this code to open to communicate with content
// browser.action.onClicked.addListener((tab) => {
//   const activeTabs = browser.tabs.query({ active: true, currentWindow: true });
//   activeTabs.then((tabs) => {
//     const activeTab = tabs[0];
//     if (activeTab) {
//       browser.tabs.sendMessage(activeTab.id!, { action: "toggle" });
//     }
//   });
// });
