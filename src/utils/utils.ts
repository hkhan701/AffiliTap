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
    
    // Get the first available tracking ID from Amazon Associates
    let trackingId = 'no_tracking_id';
    try {
      const trackingIds = await getTrackingIds();
      if (trackingIds && trackingIds.length > 0) {
        // Use the first available tracking ID
        trackingId = trackingIds[0]?.id as string;
      }
    } catch (error) {
      console.warn('Could not fetch tracking IDs for user ID generation:', error);
    }
    
    // Generate a new user ID if none exists
    const newUserId = generateUniqueId(trackingId);
    
    // Store the new user ID
    await browserStorage.set('userId', newUserId);
    
    return newUserId;
  } catch (error) {
    console.error('Error managing user ID:', error);
    // Fallback to a simple ID if storage fails
    return generateUniqueId('no_tracking_id');
  }
};

export interface AiPostResponse {
  post: string;
  remaining: number;
}

/**
 * Generates an AI post using all available templates and product data
 * @param productData The product information to use in the post
 * @returns Promise containing the generated post and remaining usage
 */
export async function getAiGeneratedPost(
  productData: string
): Promise<AiPostResponse> {
  try {
    const userId = await getUserId();
    
    // Define all template types
    const templateTypes = [
      'Promo Code',
      'Price Drop', 
      'Clip Coupon',
      'Checkout Discount',
      'Custom Instructions'
    ];
    
    // Check for empty templates first
    const emptyTemplates: string[] = [];
    const availableTemplates: string[] = [];

    templateTypes.forEach((templateType) => {
      const template = localStorage.getItem(`prompt-${templateType}`) || '';
      if (!template.trim()) {
        emptyTemplates.push(templateType);
      } else {
        availableTemplates.push(templateType);
      }
    });

    // Return detailed error if any templates are empty
    if (emptyTemplates.length > 0) {
      const emptyList = emptyTemplates.join(', ');
      
      throw new Error(
        `Missing AI training templates for: ${emptyList}. \n` +
        `Please set up all template categories in the "Train Your AI" section before generating posts.`
      );
    }

    // Collect all templates into one comprehensive string
    let combinedTemplate = '';

    templateTypes.forEach((templateType) => {
      const template = localStorage.getItem(`prompt-${templateType}`) || '';
      combinedTemplate += `\n\n--- ${templateType} Instructions ---\n${template}`;
    });

    // Clean up the combined template (remove leading newlines)
    combinedTemplate = combinedTemplate.trim();

    const response = await fetch("https://title-summarizer.vercel.app/generate_post", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ 
        user_id: userId,
        template: combinedTemplate,
        product: productData
      }),
    });

    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Invalid request data");
      }
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Try again tomorrow.");
      }
      if (response.status === 500) {
        throw new Error("Server error. Please try again later.");
      }
      throw new Error(`Failed to generate post: ${response.status}`);
    }

    const data = await response.json();
    return {
      post: data.post || "",
      remaining: data.remaining || 0
    };
  } catch (error) {
    console.error("Error generating AI post:", error);
    throw error; // Re-throw to handle in the calling component
  }
}

/**
 * Generates a unique ID without external libraries
 * @param {string} trackingId - Optional affiliate tracking ID to append
 * @returns {string} A unique identifier
 */
const generateUniqueId = (trackingId?: string): string => {
  // Use timestamp + random number for uniqueness
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const additionalRandom = Math.random().toString(36).substring(2, 15);
  
  let uniqueId = `user_${timestamp}_${randomPart}_${additionalRandom}`;
  
  if (trackingId && trackingId.trim()) {
    uniqueId += `_${trackingId.trim()}`;
  }
  
  return uniqueId;
};

export type LinkType = 'amazon' | 'posttap' | 'joylink' | 'geniuslink' | 'linktwin';

export const getLinkByType = async (url: string, linkType: LinkType = 'amazon', trackingId?: string): Promise<string> => {
        url = removeTagFromUrl(url);
        switch (linkType) {
            case 'posttap':
                const postTapResult = await fetchPostTapLink(url);
                return postTapResult.link || url;
            case 'joylink':
                const joyLinkResult = await fetchJoyLink(url);
                return joyLinkResult.link || url;
            case 'geniuslink':
                const geniusResult = await fetchGeniusLink(url, trackingId || "");
                return geniusResult.link || url;
            case 'linktwin':
                const linkTwinResult = await fetchLinkTwinLink(url);
                return linkTwinResult.link || url;
            case 'amazon':
              return await getShortUrl(trackingId || '');
            default:
                return await getShortUrl(trackingId || '');
        }
};

async function fetchJoyLink(url: string): Promise<{ link: string; error: string }> {
  try {
    const response = await fetch('https://joylink.io/api/private/link/create-link', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ destination: url }),
    });

    if (response.status === 307) {
      throw new Error('Redirected. Login required.');
    }

    const data = await response.json();
    return { link: data?.url || '', error: '' };
  } catch (err: any) {
    console.error('JoyLink error:', err);
    return { link: '', error: err.message || 'Unknown error' };
  }
}

async function fetchPostTapLink(url: string): Promise<{ link: string; error: string }> {
  try {
    const validateRes = await fetch('https://creators.posttap.com/api/validate-url', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const validateData = await validateRes.json();
    if (validateData?.meta?.status !== 'ok') {
      throw new Error(validateData?.error?.message || 'Validation failed');
    }

    const shortName = generateUniqueName(8);
    const createRes = await fetch('https://creators.posttap.com/api/create-shortlink', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: shortName, url, tags: [] }),
    });

    const createData = await createRes.json();
    if (!createRes.ok) {
      throw new Error(createData?.error?.message || 'Link creation failed');
    }

    return { link: createData?.object?.shortlink || '', error: '' };
  } catch (err: any) {
    console.error('PostTap error:', err);
    return { link: '', error: err.message || 'Unknown error' };
  }
}

async function fetchGeniusLink(url: string, groupId: string) {
  try {
    const params = new URLSearchParams();
    params.append("url", url);
    params.append("tsid", groupId);
    params.append("linkCreatorSetting", "Simple");
    params.append("trackingCode", "");
    params.append("skipAffiliateRedirect", "0");
    params.append("vanityCode", "");
    params.append("placeholderCode", "Optional custom link text");
    params.append("bulkMode", "0");
    params.append("overrides", "");
    params.append("domain", "geni.us");
    params.append("note", "");
    params.append("trackingpixels", "");
    params.append("applepreference", "0");
    params.append("affiliationdisabled", "false");

    const res = await fetch("https://my.geniuslink.com/v1/links/add", {
      method: "POST",
      credentials: "include",
      mode: "cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9",
        Origin: "https://my.geniuslink.com",
        Referer: "https://my.geniuslink.com/links",
      },
      body: params.toString(),
    });

    if (!res.ok) throw new Error("Failed to generate GeniusLink");

    const data = await res.json();
    const link = `https://${data.linkResponses?.[0]?.domain}/${data.linkResponses?.[0]?.code}`;
    return { link, error: "" };
  } catch (err) {
    console.error("GeniusLink error:", err);
    return { link: "", error: err.message || "Unknown error" };
  }
}

async function fetchLinkTwinLink(url: string): Promise<{ link: string; error: string }> {
  try {
    // Create FormData with the required fields
    const formData = new FormData();
    formData.append('url', url);
    formData.append('domain', 'https://linktw.in');

    const response = await fetch('https://linktw.in/shorten', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.message || 'LinkTwin API returned an error');
    }

    return { 
      link: data.data?.shorturl || '', 
      error: '' 
    };
  } catch (err: any) {
    console.error('LinkTwin error:', err);
    return { 
      link: '', 
      error: err.message || 'Unknown error' 
    };
  }
}

function generateUniqueName(length: number): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 2 + length);
  return `${timestamp}_${random}`;
}

/**
 * Removes tag query parameter from Amazon URLs
 * @param url The URL to clean
 * @returns The URL without tag parameters
 */
function removeTagFromUrl(url: string): string {
    try {
        const urlObj = new URL(url); 
        urlObj.searchParams.delete('tag');
        return urlObj.toString();
    } catch (error) {
        return url
    }
}

export async function updateCopied(): Promise<void> {
  try {
    const userId = await getUserId();
    
    await fetch("https://title-summarizer.vercel.app/copied", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        user_id: userId 
      }),
    });
  } catch {
  }
}