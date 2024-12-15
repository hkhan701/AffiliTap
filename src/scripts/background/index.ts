/* eslint-disable no-console */
import { browser } from "webextension-polyfill-ts"
import { verifyLicenseKey } from "@/utils/license"
import { getTrackingIds } from "@/utils/utils"
import { browserStorage } from "@/utils/browserStorage"

browser.runtime.onInstalled.addListener((): void => {
  console.log("AffiliTap is installed!")
  // Add default template data
  const defaultContent =
    "🎉 Limited Time Offer! 🎉\n{product_name}\n\n{discount_percentage}% OFF!\nSave an extra ${coupon_$} with clip on coupon\n#ad\n{amz_link}"
  getTrackingIds().then((trackingIds) => {
    const defaultTemplate = {
      id: "default",
      name: "Default Template",
      content: defaultContent,
      titleWordLimit: 10,
      trackingId: trackingIds[0]?.id || "",
      isDefault: true,
    }
    // get current templates
    browserStorage.get("templates").then((templates) => {
      // store template as array
      if (!templates) {
        browserStorage.set("templates", JSON.stringify([defaultTemplate]))
      }
    })
  })
})

browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "CHECK-LICENSE") {
    await verifyLicenseKey()
  }
})

browser.alarms.create("CHECK-LICENSE", {
  when: Date.now() + 10,
  periodInMinutes: 30,
}) // validate license every 30 mins

// Listen for product data updates from the content script
browser.runtime.onMessage.addListener(async (message) => {
  if (message.action === "SEND_PRODUCT_DATA") {
    // Notify the side panel of the updated product data
    try {
      await browser.runtime.sendMessage({
        action: "UPDATE_PRODUCT_DATA",
        data: message.data,
      })
    } catch (error) {
      // console.log("Failed to send product data. Side panel not open.");
    }
  }
})

let activeAmazonTabId: number | null = null

// Listen for tab activation (switching between tabs)
browser.tabs.onActivated.addListener((activeInfo) => {
  browser.tabs
    .get(activeInfo.tabId)
    .then((tab) => {
      if (
        tab &&
        tab.url &&
        (tab.url.includes("amazon.ca") || tab.url.includes("amazon.com"))
      ) {
        // Set the new active Amazon tab
        activeAmazonTabId = activeInfo.tabId

        // Request product data immediately for already-loaded tabs
        browser.tabs
          .sendMessage(activeAmazonTabId, { action: "REQUEST_PRODUCT_DATA" })
          .catch(() => console.log("Failed to request data on activation:"))
      } else {
        // Clear activeAmazonTabId if it's not an Amazon page
        activeAmazonTabId = null
      }
    })
    .catch(() => console.log("Error retrieving tab information:"))
})

// Listen for tab updates to detect when a tab finishes loading
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    tabId === activeAmazonTabId && // Only handle updates for the active Amazon tab
    changeInfo.status === "complete" && // Wait for the tab to fully load
    tab &&
    tab.url &&
    (tab.url.includes("amazon.ca") || tab.url.includes("amazon.com"))
  ) {
    // Request product data when the tab finishes loading
    // console.log("Requesting product data on update");
    browser.tabs
      .sendMessage(tabId, { action: "REQUEST_PRODUCT_DATA" })
      .catch(() => console.log("Failed to request data on update:"))
  }
})

// Workaround for sidePanel not working
const { sidePanel } = browser as any
sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.log(error))
