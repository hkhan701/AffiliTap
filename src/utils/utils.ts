import { browser } from "webextension-polyfill-ts"
import { getPage } from "@/utils/urls"
import { browserStorage } from "./browserStorage"

/**
 * Converts a JPEG image URL to a PNG data URL.
 *
 * @param {string} jpgUrl URL of the JPEG image to be converted.
 * @returns {Promise<string>} Promise that resolves with the PNG data URL.
 */
export const convertJpgToPng = (jpgUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = function () {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      ctx.drawImage(img, 0, 0)
      const pngDataUrl = canvas.toDataURL("image/png")
      resolve(pngDataUrl)
    }
    img.src = jpgUrl
  })
}

/**
 * Modifies an Amazon image link to have a larger size.
 * Given a link like https://m.media-amazon.com/images/I/41oV5VxVpFL._AC_SY1000_.jpg,
 * this function returns https://m.media-amazon.com/images/I/41oV5VxVpFL._AC_SL1500_.jpg.
 * If the link does not have two decimal points, it is returned unchanged.
 * @param {string} link
 * @return {string}
 */
export const modifyImageLink = (link: string): string => {
  // Find the positions of the last two decimal points
  const lastDotIndex = link.lastIndexOf(".")
  const secondLastDotIndex = link.substring(0, lastDotIndex).lastIndexOf(".")

  if (lastDotIndex !== -1 && secondLastDotIndex !== -1) {
    // Extract the base URL, replace portion, and extension
    const baseUrl = link.substring(0, secondLastDotIndex)
    const extension = link.substring(lastDotIndex)

    // Append _AC_SL1500_ before the extension
    const newLink = `${baseUrl}._AC_SL1500_${extension}`
    return newLink
  }
  // Return the original link if two decimal points are not found
  return link
}

/**
 * Returns the SHA-256 hash of the given message as a hexadecimal string.
 * @param message The message to hash.
 * @returns A promise that resolves with the SHA-256 hash of the message as a hexadecimal string.
 */
async function md5Hash(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Gets a short URL for the currently active tab using the given tracking ID.
 * @param {string} trackingId - Tracking ID to use for the short URL.
 * @returns {Promise<string>} The short URL.
 */
export const getShortUrl = async (trackingId: string): Promise<string> => {
  try {
    const tabs = await browser.tabs.query({
      active: true,
      lastFocusedWindow: true,
    })
    const activeTab = tabs[0]
    const longUrl = activeTab.url

    const obj = {
      p_parameter: "SS v2",
      test_name: "SiteStripe V3.0",
      toolCreation: "SS",
      adUnitType: "TEXT",
      adUnitDescription: "Product links Text only link",
      destinationType: "ASIN",
      marketplaceId: "1",
      store: trackingId,
      tag: trackingId,
      adUnitSubType: "ShortLinks",
      linkCode: "sl1",
      createTime: new Date().getTime(),
    }

    const linkId = await md5Hash(JSON.stringify(obj))
    const linkToFetch = `https://www.amazon.ca/associates/sitestripe/getShortUrl?longUrl=${encodeURIComponent(
      `${longUrl}&linkCode=sl1&tag=${trackingId}&linkId=${linkId}`,
    )}&language=en_CA&ref_=as_li_ss_tl&marketplaceId=7`

    const res = await fetch(linkToFetch)
    const links = await res.json()
    return links.shortUrl
  } catch (error) {
    console.log("Unexpected error fetching short URL: ", error)
    return ""
  }
}

/**
 * Get an array of tracking IDs from Amazon Associates.
 * @returns an array of tracking IDs.
 */
export const getTrackingIds = async () => {
  const caUrl = `https://www.amazon.ca/associates/sitestripe/getStoreTagMap?marketplaceId=7`;
  const usUrl = `https://www.amazon.com/associates/sitestripe/getStoreTagMap?marketplaceId=1`;

  try {
    const [caResult, usResult] = await Promise.allSettled([
      fetch(caUrl).then((response) => {
        if (!response.ok) {
          throw new Error(`Error fetching CA data: ${response.status}`);
        }
        return response.json();
      }),
      fetch(usUrl).then((response) => {
        if (!response.ok) {
          throw new Error(`Error fetching US data: ${response.status}`);
        }
        return response.json();
      }),
    ]);

    const caTrackingIds =
      caResult.status === "fulfilled" && caResult.value.storeTagMap
        ? Object.values(caResult.value.storeTagMap)
            .flat()
            .map((id) => ({ id, country: "CA" }))
        : [];

    const usTrackingIds =
      usResult.status === "fulfilled" && usResult.value.storeTagMap
        ? Object.values(usResult.value.storeTagMap)
            .flat()
            .map((id) => ({ id, country: "US" }))
        : [];

    return [...caTrackingIds, ...usTrackingIds];
  } catch (error) {
    console.log("Unexpected error fetching tracking IDs: ", error);
    return [];
  }
};


/**
 * Function to shorten a product name
 * @param productName the product name to shorten
 * @param titleLimit the maximum number of words to include in the shortened name
 * @returns the shortened product name
 *
 * If 0, null, or undefined, return an empty string
 * Otherwise, return the shortened product name
 */
export const shortenProductName = (
  productName: string,
  titleLimit: number | null | undefined,
) =>
  productName == null || titleLimit == null
    ? ""
    : productName.split(" ").slice(0, titleLimit).join(" ")

// Update with real purchase link
export const handlePurchaseRedirect = () => {
  window.open(
    "https://affilitap.lemonsqueezy.com/buy/7ab05e49-af4e-45a3-8597-41ed999ca240",
    "_blank",
  )
}

export const handleBillingRedirect = () => {
  window.open("https://affilitap.lemonsqueezy.com/billing", "_blank")
}

export const handleAddTemplate = () => {
  browser.tabs.create({ url: browser.runtime.getURL(getPage("index.html")) })
}

export interface AiTitleResponse {
  short_title: string;
  remaining: number;
}

export async function getAiGeneratedTitle(fullTitle: string): Promise<AiTitleResponse | null> {
  try {
    const userId = await getUserId();
    
    const response = await fetch("https://title-summarizer.vercel.app/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        title: fullTitle,
        user_id: userId 
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Try again tomorrow.");
      }
      throw new Error("Failed to fetch AI title");
    }

    const data = await response.json();
    return {
      short_title: data.short_title || null,
      remaining: data.remaining || 0
    };
  } catch (error) {
    console.error("Error fetching AI title:", error);
    throw error; // Re-throw to handle in the calling component
  }
}

/**
 * Generates a unique user ID or retrieves existing one from browser storage
 * @returns {Promise<string>} The user ID
 */
export const getUserId = async (): Promise<string> => {
  try {
    // Try to get existing user ID from storage
    const existingUserId = await browserStorage.get('userId');
    
    if (existingUserId) {
      return existingUserId;
    }
    
    // Generate a new user ID if none exists
    const newUserId = generateUniqueId();
    
    // Store the new user ID
    await browserStorage.set('userId', newUserId);
    
    return newUserId;
  } catch (error) {
    console.error('Error managing user ID:', error);
    // Fallback to a simple ID if storage fails
    return generateUniqueId();
  }
};

/**
 * Generates a unique ID without external libraries
 * @returns {string} A unique identifier
 */
const generateUniqueId = (): string => {
  // Use timestamp + random number for uniqueness
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const additionalRandom = Math.random().toString(36).substring(2, 15);
  
  return `user_${timestamp}_${randomPart}_${additionalRandom}`;
};