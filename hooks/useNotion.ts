/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from "react";
import { DatabaseSchema, ProcessedContentData, Settings, DatabaseConnection } from "../types";
import { AppDispatch } from "../state/appReducer";
import { CORS_PROXY_URL, NOTION_API_VERSION, handleNotionApiCall } from "../utils/api";
import { createParagraphBlocks } from "../utils/notion";

const buildNotionProperties = (content: ProcessedContentData, schema: DatabaseSchema) => {
    const properties: Record<string, any> = {};
    for (const [propName, propDetails] of Object.entries(schema)) {
        let value = content[propName];
        if (value === undefined || value === null) continue;
        switch (propDetails.type) {
            case 'title':
                if (value) properties[propName] = { title: [{ text: { content: value as string } }] };
                break;
            case 'rich_text':
                if (value) properties[propName] = { rich_text: [{ text: { content: value as string } }] };
                break;
            case 'url':
                properties[propName] = { url: (value as string) || null };
                break;
            case 'email':
                if (value) properties[propName] = { email: value as string };
                break;
            case 'phone_number':
                if (value) properties[propName] = { phone_number: value as string };
                break;
            case 'number':
                const numValue = Number(value);
                if (!isNaN(numValue)) properties[propName] = { number: numValue };
                break;
            case 'checkbox':
                properties[propName] = { checkbox: Boolean(value) };
                break;
            case 'select':
                if (value) properties[propName] = { select: { name: value as string } };
                break;
            case 'multi_select':
                if (Array.isArray(value) && value.length > 0) properties[propName] = { multi_select: value.map(topic => ({ name: topic })) };
                break;
            case 'date':
                if (typeof value === 'string' && value) {
                    properties[propName] = { date: { start: value } };
                } else {
                    properties[propName] = { date: null };
                }
                break;
            case 'relation': // Relations cannot be set by AI, so we skip them.
            default: break;
        }
    }
    return properties;
}

const buildNotionPageBlocks = (content: ProcessedContentData, originalText: string, originalFiles: File[], publicUrls: (string | null)[]) => {
    const { pageContent } = content;
    const dividerBlock = { object: 'block', type: 'divider', divider: {} };
    const children: any[] = [
        { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: pageContent.summaryTitle || 'Summary' } }] } },
        ...createParagraphBlocks(pageContent.summaryBody),
        dividerBlock,
        { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: 'Key Takeaways' } }] } },
        ...pageContent.takeaways.map(item => ({ object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: item } }] } })),
    ];
    if (originalText) { children.push(dividerBlock, { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Original Text' } }] } }, ...createParagraphBlocks(originalText)); }
    if (originalFiles.length > 0) {
        children.push(dividerBlock, { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Original Files' } }] } });
        originalFiles.forEach((file, index) => {
            const url = publicUrls[index];
            if (url) { // If upload was successful and we have a public URL
                if (file.type.startsWith('image/')) {
                    children.push({ object: 'block', type: 'image', image: { type: 'external', external: { url } } });
                } else if (file.type === 'application/pdf') {
                    children.push({ object: 'block', type: 'embed', embed: { url } });
                } else {
                    children.push({ object: 'block', type: 'file', file: { type: 'external', external: { url }, name: file.name } });
                }
            } else { // Fallback if upload failed
                children.push({ object: 'block', type: 'callout', callout: { rich_text: [{ type: 'text', text: { content: `Analyzed file (upload failed): ${file.name}` } }], icon: { emoji: '📎' } } });
            }
        });
    }
    return children;
};

export const useNotion = (dispatch: AppDispatch) => {
    const handleFetchSchema = useCallback(async (notionApiKey: string, notionDatabaseId: string, isSilent = false): Promise<DatabaseSchema | null> => {
        if (!notionApiKey || !notionDatabaseId) {
             if (!isSilent) dispatch({ type: 'SET_ERROR', payload: 'Please provide a Notion API Key and Database ID.' });
             return null;
        }
        if (!isSilent) dispatch({ type: 'SET_STATUS', payload: 'fetchingSchema' });
        try {
            const data = await handleNotionApiCall(`${CORS_PROXY_URL}https://api.notion.com/v1/databases/${notionDatabaseId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${notionApiKey}`, 'Notion-Version': NOTION_API_VERSION },
            });
            if (!isSilent) dispatch({ type: 'SET_SUCCESS', payload: 'Successfully connected to Notion database!' });
            return data.properties;
        } catch (e: any) {
            console.error(e);
            if (!isSilent) dispatch({ type: 'SET_ERROR', payload: e.message || 'Failed to fetch database schema.' });
            return null;
        }
    }, [dispatch]);

    const uploadToNotion = useCallback(async (
        connection: Pick<DatabaseConnection, 'notionApiKey' | 'notionDatabaseId'>,
        processedContent: ProcessedContentData,
        databaseSchema: DatabaseSchema,
        inputText: string, 
        inputFiles: File[], 
        publicUrls: (string | null)[] // Accept the public URLs
    ) => {
        dispatch({ type: 'SET_STATUS', payload: 'uploadingNotion' });

        try {
            const properties = buildNotionProperties(processedContent, databaseSchema);
            const children = buildNotionPageBlocks(processedContent, inputText, inputFiles, publicUrls);

            const data = await handleNotionApiCall(`${CORS_PROXY_URL}https://api.notion.com/v1/pages`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${connection.notionApiKey}`, 'Notion-Version': NOTION_API_VERSION, 'Content-Type': 'application/json' },
                body: JSON.stringify({ parent: { database_id: connection.nionDatabaseId }, properties, children }),
            });
            
            dispatch({ type: 'SET_SUCCESS', payload: `Page created! View it here: ${data.url.replace("https://www.", "notion://")}` });
        } catch(e: any) {
            console.error(e);
            dispatch({ type: 'SET_ERROR', payload: e.message || 'Failed to upload to Notion.' });
        }
    }, [dispatch]);

    return {
        handleFetchSchema,
        uploadToNotion,
    };
};
