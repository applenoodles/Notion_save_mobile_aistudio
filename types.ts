/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- CONSTANTS ---
export const AI_PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    models: ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro'],
  },
  openrouter: {
    name: 'OpenRouter',
    models: [
        'openai/gpt-oss-20b:free',
        'z-ai/glm-4.5-air:free',
        'deepseek/deepseek-chat-v3-0324:free',
        'deepseek/deepseek-r1-0528:free',
        'deepseek/deepseek-r1:free',
        'moonshotai/kimi-vl-a3b-thinking:free'
    ],
  },
};

export type AiProviderKey = keyof typeof AI_PROVIDERS;


// --- TYPE DEFINITIONS ---
export interface DatabaseConnection {
    id: string;
    name: string;
    notionApiKey: string;
    notionDatabaseId: string;
    systemPrompt?: string;
}

export interface Settings {
    connections: DatabaseConnection[];
    activeDatabaseId: string | null;
    aiProvider: AiProviderKey;
    aiApiKey: string;
    selectedModel: string;
    systemPrompt: string;
}

export type NotionPropertyOption = { name: string };

export type NotionPropertyDetails =
  | { id: string; type: 'title'; title: Record<string, unknown> }
  | { id: string; type: 'select'; select: { options: NotionPropertyOption[] } }
  | { id: string; type: 'multi_select'; multi_select: { options: NotionPropertyOption[] } }
  | { id: string; type: 'rich_text'; rich_text: Record<string, unknown> }
  | { id: string; type: 'url'; url: Record<string, unknown> }
  | { id: string; type: 'date'; date: Record<string, unknown> }
  | { id: string; type: 'relation'; relation: Record<string, unknown> }
  | { id: string; type: 'number'; number: Record<string, unknown> }
  | { id: string; type: 'checkbox'; checkbox: Record<string, unknown> }
  | { id: string; type: 'email'; email: Record<string, unknown> }
  | { id: string; type: 'phone_number'; phone_number: Record<string, unknown> }
  | { id: string; type: string; [key: string]: any }; // Catch-all for other types

export type DatabaseSchema = Record<string, NotionPropertyDetails>;

export interface PageContent {
  summaryTitle: string;
  summaryBody: string;
  takeaways: string[];
}

export interface ProcessedContentData {
  pageContent: PageContent;
  [key: string]: string | string[] | number | boolean | PageContent | undefined;
}