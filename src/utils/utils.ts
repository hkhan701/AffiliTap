import { browser } from "webextension-polyfill-ts";
import { getPage } from "@/utils/urls";

export async function md5Hash(message: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

export const handlePurchaseRedirect = () => {
    window.open("https://affilitap.lemonsqueezy.com/checkout", "_blank"); // Update with real purchase link
}

export const handleAddTemplate = () => {
    browser.tabs.create({
        url: browser.runtime.getURL(getPage("index.html")),
    });
}

export const getShortUrl = async (trackingId: string) => {
    const tabs = await browser.tabs.query({ active: true, lastFocusedWindow: true });
    const activeTab = tabs[0];
    const longUrl = activeTab.url;

    const obj = {
        p_parameter: 'SS v2',
        test_name: 'SiteStripe V3.0',
        toolCreation: 'SS',
        adUnitType: 'TEXT',
        adUnitDescription: 'Product links Text only link',
        destinationType: 'ASIN',
        marketplaceId: '1',
        store: trackingId,
        tag: trackingId,
        adUnitSubType: 'ShortLinks',
        linkCode: 'sl1',
        createTime: new Date().getTime(),
    };

    const linkId = await md5Hash(JSON.stringify(obj));
    const linkToFetch = `https://www.amazon.ca/associates/sitestripe/getShortUrl?longUrl=`
    +encodeURIComponent(`${longUrl}&linkCode=sl1&tag=${trackingId}&linkId=${linkId}`)
     + `&language=en_CA&ref_=as_li_ss_tl&marketplaceId=7`

    const res = await fetch(linkToFetch);
    const links = await res.json();
    console.log("The links are: ", links);
    return links.shortUrl;
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
export const shortenProductName = (productName: string, titleLimit: number | null | undefined) =>
    titleLimit == null ? '' : productName.split(' ').slice(0, titleLimit).join(' ');