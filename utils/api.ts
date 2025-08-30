/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- CONSTANTS & CONFIGURATION ---
export const NOTION_API_VERSION = '2022-06-28';
// Using a more reliable CORS proxy that doesn't require manual activation.
export const CORS_PROXY_URL = 'https://corsproxy.io/?';

export const handleNotionApiCall = async (url: string, options: RequestInit) => {
    const response = await fetch(url, options);
    const responseText = await response.text();
    let data;
    try {
        data = JSON.parse(responseText);
    } catch (jsonError) {
        // Generic error if JSON parsing fails.
        // The previous check for 'cors anywhere' is no longer needed.
        const errorDetail = responseText.length > 150 ? `${responseText.substring(0, 150)}...` : responseText;
        throw new Error(`Could not connect to Notion. The server sent an invalid response. Status: ${response.status}. Details: ${errorDetail}`);
    }
    if (!response.ok) {
        const errorMessage = data?.message ? `Notion API Error: ${data.message}` : `Notion API Error: Received status ${response.status}`;
        throw new Error(errorMessage);
    }
    return data;
};