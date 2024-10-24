import { browserStorage } from './browserStorage';

const LEMON_SQUEEZY_API_BASE_URL = 'https://api.lemonsqueezy.com/v1/licenses';
const HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded',
};

/**
 * General function to handle API requests to Lemon Squeezy.
 * @param {string} endpoint - The API endpoint to hit (either 'verify' or 'activate').
 * @param {string} licenseKey - The license key to process.
 * @param {string} instanceName - The unique instance name (for verification/activation).
 * @returns {Promise<any>} - Returns the response data from the API call.
 */
const callLemonSqueezyAPI = async (endpoint: 'verify' | 'activate', licenseKey: string, instanceName: string): Promise<any> => {
    try {
    const params = new URLSearchParams({
      license_key: licenseKey,
      instance_name: instanceName,
    });
    const response = await fetch(`${LEMON_SQUEEZY_API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: HEADERS,
      body: params.toString(),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error during license ${endpoint}:`, error);
    return null;
  }
};

/**
 * Verify the license key with Lemon Squeezy.
 * @param {string} licenseKey - The license key to verify.
 * @param {string} instanceName - The unique instance name.
 * @returns {Promise<boolean>} - Returns true if the license is valid, false otherwise.
 */
export const verifyLicenseKey = async (licenseKey: string, instanceName: string): Promise<boolean> => {
  const data = await callLemonSqueezyAPI('verify', licenseKey, instanceName);
  return data ? data.valid : false;
};

/**
 * Activate the license key with Lemon Squeezy.
 * @param {string} licenseKey - The license key to activate.
 * @returns {Promise<boolean>} - Returns true if the license was activated successfully.
 */
export const activateLicenseKey = async (licenseKey: string): Promise<boolean> => {
  const instanceName = Date.now().toString(36) + Math.random().toString(36).substring(2); // Use UUID for instance name
  console.log(`Instance name: ${instanceName}`);
  const data = await callLemonSqueezyAPI('activate', licenseKey, instanceName);
  if(!data) return false

  if (data.activated) {
    await browserStorage.set('licenseKey', licenseKey);
  }
    return true;
};
