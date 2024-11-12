/* eslint-disable no-console */
import { browser } from "webextension-polyfill-ts"
import { verifyLicenseKey } from "@/utils/license";
import { getTrackingIds } from "@/utils/utils";
import { browserStorage } from "@/utils/browserStorage";

browser.runtime.onInstalled.addListener((): void => { 
  console.log('AffiliTap is installed!');
  // Add default template data
  const defaultContent = '🎉 Limited Time Offer! 🎉\n{product_name}\n\n{discount_percentage}% OFF!\nSave an extra ${coupon_$} with clip on coupon\n#ad\n{amz_link}'
  getTrackingIds().then((trackingIds) => {
    const defaultTemplate = {
      id: "default",
      name: 'Default Template',
      content: defaultContent,
      titleWordLimit: 10,
      trackingId: trackingIds[0]?.id || '',
      isDefault: true
    }
    //get current templates
    browserStorage.get('templates').then((templates) => {
      // store template as array
      if (!templates) {
        browserStorage.set('templates', JSON.stringify([defaultTemplate]));
      }
    })
  });
})

browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'CHECK-LICENSE') {
    await verifyLicenseKey();
  }
});

browser.alarms.create('CHECK-LICENSE', {
  when: Date.now() + 10,
  periodInMinutes: 1,
}) // validate license every 1 mins

// Listen for product data updates from the content script
browser.runtime.onMessage.addListener(async (message) => {
  if (message.action === "SEND_PRODUCT_DATA") {
    // Notify the side panel of the updated product data
    try {
      await browser.runtime.sendMessage({ action: "UPDATE_PRODUCT_DATA", data: message.data });
    } catch (error) {
      console.log("Failed to send product data. Side panel not open.");
    }
  }
});

// Handle tab switching to retrieve product data on Amazon product pages
browser.tabs.onActivated.addListener((activeInfo) => {
  browser.tabs.get(activeInfo.tabId)
    .then((tab) => {
      const tabId = activeInfo.tabId;

      // Check if the active tab URL is an Amazon product page
      if (tab.url && (tab.url.includes("amazon.ca") || tab.url.includes("amazon.com"))) {
        return browser.scripting.executeScript({
          target: { tabId },
          files: ["content.js"]
        })
          .then(() => {
            // Request product data from the content script in the active tab
            return browser.tabs.sendMessage(tab.id, { action: "REQUEST_PRODUCT_DATA" });
          })
          .then((response) => {
            // Notify the side panel of the updated product data
            return browser.runtime.sendMessage({ action: "UPDATE_PRODUCT_DATA", data: response.data });
          })
          .catch((error) => {
            // console.log("Failed to fetch product data:", error);
          });
      }
    })
    .catch((error) => console.log("Error retrieving tab information:", error));
});


// Workaround for sidePanel not working
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
