import { browserStorage } from './browserStorage';

const LEMON_SQUEEZY_API_BASE_URL = 'https://api.lemonsqueezy.com/v1/licenses';
const HEADERS = {
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
};
const BASIC_PLAN = "Basic Plan";
const PRO_PLAN = "Pro Plan";

const STORE_ID = 130802;
const PRODUCT_ID = 396601;
const VARIANT_PRO_PLAN_ID = 603012;
const VARIANT_BASIC_PLAN_ID = 603013;

/**
 * General function to handle API requests to Lemon Squeezy.
 * @param {string} endpoint - The API endpoint to hit (either 'verify', 'activate', or 'deactivate').
 * @param {string} licenseKey - The license key to process.
 * @param {string} instanceName - The unique instance name (for verification/activation).
 * @returns {Promise<any>} - Returns the response data from the API call.
 */
const callLemonSqueezyAPI = async (endpoint: 'validate' | 'activate' | 'deactivate', licenseKey: string, params: object): Promise<any> => {
    try {
        const body = new URLSearchParams({
            license_key: licenseKey,
            ...params
        });

        const response = await fetch(`${LEMON_SQUEEZY_API_BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: HEADERS,
            body: body.toString(),
        });

        return await response.json();
    } catch (error) {
        console.error(`Error during license ${endpoint}:`, error);
        return null;
    }
};

/**
 * Load the full license data object from storage.
 */
const loadLicenseData = async (): Promise<any> => {
    return await browserStorage.get('licenseData');
};

/**
 * Save the full license data object to storage.
 */
const saveLicenseData = async (data: Record<string, any>) => {
    await browserStorage.set('licenseData', data);
};

/**
 * Extract specific parts of the license data.
 */
export const getLicenseStatus = async (): Promise<string | null> => {
    const data = await loadLicenseData();
    return data?.license_key?.status || null;
};

const getInstanceDetails = async () => {
    const data = await loadLicenseData();
    return data?.instance || null;
};

const getMetaData = async () => {
    const data = await loadLicenseData();
    return data?.meta || null;
};

/**
 * Get the license key from storage.
 */
export const getLicenseKey = async () => {
    const data = await loadLicenseData();
    return data?.license_key?.key || null;
}

/**
 * Check if the license is active.
 */
export const hasValidLicense = async (): Promise<boolean> => {
    const status = await getLicenseStatus();
    return status === 'active';
};

/**
 * Check if the subscription is for the starter plan.
 */
export const hasBasicSubscription = async (): Promise<boolean> => {
    const meta = await getMetaData();
    return (await hasValidLicense()) && meta?.variant_id === VARIANT_BASIC_PLAN_ID;
};

/**
 * Check if the subscription is for the professional plan.
 */
export const hasProfessionalSubscription = async (): Promise<boolean> => {
    const meta = await getMetaData();
    return (await hasValidLicense()) && meta?.variant_id === VARIANT_PRO_PLAN_ID;
};

export const getCurrentPlan = async (): Promise<string | null> => {
    const meta = await getMetaData();
    return meta?.variant_name || null;
}

/**
 * Activate the license key with Lemon Squeezy.
 * @param {string} licenseKey - The license key to activate.
 * @returns {Promise<boolean>}
 */
export const activateLicenseKey = async (licenseKey: string): Promise<boolean> => {
    if (!licenseKey) return false;

    const instance_name = Date.now().toString(36) + Math.random().toString(36).substring(2); // Using UUID for unique instance name
    const data = await callLemonSqueezyAPI('activate', licenseKey, { instance_name });

    if (!data || !data.activated) return false;
    // check that the store id matches
    console.log(data.meta.store_id, STORE_ID, data.meta.product_id, PRODUCT_ID);
    if (data.meta.store_id !== STORE_ID || data.meta.product_id !== PRODUCT_ID) return false;

    // Save the full data object in storage
    await saveLicenseData(data);
    return true;
};

/**
 * Deactivate the license key.
 * @returns {Promise<boolean>}
 */
export const deactivateLicenseKey = async (): Promise<boolean> => {
    const data = await loadLicenseData();
    const licenseKey = data?.license_key?.key;
    const instanceId = data?.instance?.id;

    if (!licenseKey || !instanceId) return false;

    const response = await callLemonSqueezyAPI('deactivate', licenseKey, instanceId);
    return response ? response.deactivated : false;
};

/**
 * Verify the license key.
 * @returns {Promise<boolean>}
 */
export const verifyLicenseKey = async (): Promise<boolean> => {
    const data = await loadLicenseData();
    const licenseKey = data?.license_key?.key;
    const instanceId = data?.instance?.id;

    if (!licenseKey || !instanceId) return false;

    const response = await callLemonSqueezyAPI('validate', licenseKey, { instance_id: instanceId});
    if (response.valid && response.license_key.key === licenseKey && response.instance.id === instanceId && response.meta.store_id === STORE_ID && response.meta.product_id === PRODUCT_ID) {
        // console.log('Valid license key. Saving to storage...');
        await saveLicenseData(response);
        return true;
    } else {
        // console.log('Invalid license key. Removing from storage...');
        await browserStorage.remove('licenseData');
        return false;
    }
};
