import { browser } from "webextension-polyfill-ts"
/**
 * Utility for managing browser local storage.
 */
export const browserStorage = {
    /**
     * Set a key-value pair in browser's local storage.
     * @param {string} key - The key for the storage item.
     * @param {any} value - The value to store (will be stringified if not a string).
     * @returns {Promise<void>} - Resolves when the value is set.
     */
    set: async (key: string, value: any): Promise<void> => {
        return new Promise((resolve, reject) => {
            const data = { [key]: value };
            browser.storage.local.set(data).then(() => {
                console.log(`Set ${key} to`, value);
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    },

    /**
     * Get a value from browser's local storage by key.
     * @param {string} key - The key for the storage item.
     * @returns {Promise<any>} - Resolves with the retrieved value or undefined if not found.
     */
    get: async (key: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            browser.storage.local.get([key]).then((result) => {
                console.log(`Got ${key}:`, result[key]);
                resolve(result[key]);
            }).catch((error) => {
                reject(error);
            });
        });
    },

    /**
     * Remove a key-value pair from browser's local storage.
     * @param {string} key - The key for the storage item.
     * @returns {Promise<void>} - Resolves when the key is removed.
     */
    remove: async (key: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            browser.storage.local.remove([key]).then((result) => {
                console.log(`Removed ${key}:`, result[key]);
                resolve(result[key]);
            }).catch((error) => {
                reject(error);
            });
        });
    },


};
