/* eslint-disable no-console */

import { browser } from "webextension-polyfill-ts"
import { verifyLicenseKey } from "@/utils/license";
import { get } from "http";

browser.runtime.onInstalled.addListener((): void => {
  console.log("🦄", "extension installed")
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
