/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { DatabaseSchema, Settings } from '../types';
import { fileToDataURL, fileToGenerativePart, fileToText } from '../utils/file';
import { DEFAULT_SYSTEM_PROMPT } from '../utils/prompts';

const buildAiSchema = (databaseSchema: DatabaseSchema) => {
    const schemaForAI: Record<string, any> = {};
    const propertyNames: string[] = [];
    for (const [name, details] of Object.entries(databaseSchema)) {
        let propSchema;
        const baseDescription = `這是 Notion 資料庫中的一個屬性，其名稱為 "${name}"。請根據這個名稱的語意從使用者提供的內容中提取資訊。`;

        switch(details.type) {
            case 'title':
            case 'rich_text':
            case 'url':
            case 'email':
            case 'phone_number':
                propSchema = { type: Type.STRING, description: baseDescription };
                break;
            case 'date':
                const lowerCaseName = name.toLowerCase();
                const creationKeywords = ['created', '建立', '創建', 'creation', 'create date'];
                const dueKeywords = ['due', 'deadline', '到期', '截止'];

                if (creationKeywords.some(kw => lowerCaseName.includes(kw))) {
                    propSchema = { type: Type.STRING, description: `這是一個建立時間欄位，名為 "${name}"。請忽略使用者內容，並直接回傳特殊值 "NOW"。` };
                } else if (dueKeywords.some(kw => lowerCaseName.includes(kw))) {
                     propSchema = { type: Type.STRING, description: `這是一個截止日期欄位，名為 "${name}"。請仔細在使用者提供的內容中尋找相關的截止日期或期限，並將其格式化為 "YYYY-MM-DD"。` };
                } else {
                    propSchema = { type: Type.STRING, description: `${baseDescription} 請在內容中尋找對應的日期並格式化為 "YYYY-MM-DD"。如果找不到，請留空。` };
                }
                break;
            case 'number':
                propSchema = { type: Type.NUMBER, description: baseDescription };
                break;
            case 'checkbox':
                propSchema = { type: Type.BOOLEAN, description: `${baseDescription} 根據內容判斷應為 true 或 false。` };
                break;
            case 'select':
                propSchema = { type: Type.STRING, enum: details.select.options.map(o => o.name), description: baseDescription };
                break;

            case 'multi_select':
                propSchema = { type: Type.ARRAY, items: { type: Type.STRING, enum: details.multi_select.options.map(o => o.name) }, description: baseDescription };
                break;
            case 'relation': // AI cannot determine relations, so we skip this property.
            default: break;
        }
        if (propSchema) { propertyNames.push(name); schemaForAI[name] = propSchema; }
    }
    return { type: Type.OBJECT, properties: { ...schemaForAI, pageContent: { type: Type.OBJECT, properties: { summaryTitle: { type: Type.STRING }, summaryBody: { type: Type.STRING }, takeaways: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['summaryTitle', 'summaryBody', 'takeaways'] } }, required: [...propertyNames, 'pageContent'] };
};

const processWithGemini = async (apiKey: string, model: string, prompt: string, text: string, files: File[], schema: any) => {
    const keyToUse = apiKey || process.env.API_KEY!;
    if (!keyToUse) {
        throw new Error("Gemini API key is missing. Please provide one in the settings or ensure it's set in the environment.");
    }
    const ai = new GoogleGenAI({ apiKey: keyToUse });
    const contentParts: any[] = [{ text: prompt }];
    if (text) contentParts.push({ text: `User-provided text:\n\n${text}` });
    for (const file of files) contentParts.push(await fileToGenerativePart(file));

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: contentParts },
        config: { responseMimeType: "application/json", responseSchema: schema },
    });
    return response.text;
};

const processWithOpenRouter = async (apiKey: string, model: string, prompt: string, text: string, files: File[], schema: any) => {
    const content: any[] = [{ type: 'text', text: `${prompt}\n\nThe JSON schema to follow is: ${JSON.stringify(schema)}` }];
    if (text) content.push({ type: 'text', text: `User-provided text:\n\n${text}` });
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        content.push({ type: 'image_url', image_url: { url: await fileToDataURL(file) } });
      } else if (file.type.startsWith('text/')) {
        const fileText = await fileToText(file);
        content.push({ type: 'text', text: `\n\nContent from attached file "${file.name}":\n\n${fileText}` });
      } else {
        content.push({ type: 'text', text: `\n\nAn attached file named "${file.name}" of type "${file.type}" was also provided for context.` });
      }
    }
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model, messages: [{ role: 'user', content }], response_format: { type: 'json_object' } })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenRouter API Error: ${errorData.error?.message || response.statusText}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
};

const refineWithGemini = async (apiKey: string, model: string, refinementInstruction: string, text: string, files: File[], currentJson: object, schema: any) => {
    const keyToUse = apiKey || process.env.API_KEY!;
    if (!keyToUse) throw new Error("Gemini API key is missing. Please provide one in the settings or ensure it's set in the environment.");
    const ai = new GoogleGenAI({ apiKey: keyToUse });

    const refinementPrompt = `
        You are an AI assistant refining a JSON object that was previously generated.
        The user has provided the following instruction for refinement: "${refinementInstruction}"

        Here is the current JSON object to be refined:
        ${JSON.stringify(currentJson, null, 2)}

        Please apply the refinement instruction to the JSON object.
        Your response MUST be ONLY the updated JSON object, adhering strictly to the provided schema. Do not add any explanatory text or markdown formatting.
    `;
    const contentParts: any[] = [{ text: refinementPrompt }];
    if (text) contentParts.push({ text: `For context, here is the original user-provided text that generated the JSON:\n\n${text}` });
    for (const file of files) contentParts.push(await fileToGenerativePart(file));

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: contentParts },
        config: { responseMimeType: "application/json", responseSchema: schema },
    });
    return response.text;
};

const refineWithOpenRouter = async (apiKey: string, model: string, refinementInstruction: string, text: string, files: File[], currentJson: object, schema: any) => {
    const refinementPrompt = `
        You are an AI assistant refining a JSON object that was previously generated.
        The user has provided the following instruction for refinement: "${refinementInstruction}"
        Here is the current JSON object to be refined:
        ${JSON.stringify(currentJson, null, 2)}
        Please apply the refinement instruction to the JSON object. Your response MUST be ONLY the updated JSON object that is a valid JSON.
        The JSON schema to follow is: ${JSON.stringify(schema)}
    `;
    const content: any[] = [{ type: 'text', text: refinementPrompt }];
    if (text) content.push({ type: 'text', text: `For context, here is the original user-provided text that generated the JSON:\n\n${text}` });
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        content.push({ type: 'image_url', image_url: { url: await fileToDataURL(file) } });
      } else if (file.type.startsWith('text/')) {
        const fileText = await fileToText(file);
        content.push({ type: 'text', text: `\n\nFor context, content from attached file "${file.name}":\n\n${fileText}` });
      } else {
        content.push({ type: 'text', text: `\n\nFor context, an attached file named "${file.name}" of type "${file.type}" was also provided.` });
      }
    }
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model, messages: [{ role: 'user', content }], response_format: { type: 'json_object' } })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenRouter API Error: ${errorData.error?.message || response.statusText}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
};

export const useAI = () => {
    const processContent = useCallback(async (
        settings: Settings,
        inputText: string, 
        inputFiles: File[], 
        databaseSchema: DatabaseSchema
    ) => {
        const activeConnection = settings.connections.find(c => c.id === settings.activeDatabaseId);
        const prompt = activeConnection?.systemPrompt || settings.systemPrompt || DEFAULT_SYSTEM_PROMPT;
        const responseSchema = buildAiSchema(databaseSchema);

        const responseText = settings.aiProvider === 'gemini'
            ? await processWithGemini(settings.aiApiKey, settings.selectedModel, prompt, inputText, inputFiles, responseSchema)
            : await processWithOpenRouter(settings.aiApiKey, settings.selectedModel, prompt, inputText, inputFiles, responseSchema);
        
        let parsedContent;
        try {
            // The AI response might be wrapped in markdown (e.g., ```json ... ```),
            // so we extract the JSON object from the string.
            const startIndex = responseText.indexOf('{');
            const endIndex = responseText.lastIndexOf('}');
            if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
                throw new Error("No valid JSON object found in the AI response.");
            }
            const jsonString = responseText.substring(startIndex, endIndex + 1);
            parsedContent = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse AI response:", responseText);
            throw new Error("The AI returned an invalid response. Please check the content and try again.");
        }

        if (!parsedContent.pageContent || typeof parsedContent.pageContent !== 'object') {
            parsedContent.pageContent = { summaryTitle: 'Summary (auto-generated)', summaryBody: '', takeaways: [] };
        }

        return parsedContent;
    }, []);

    const refineContent = useCallback(async (
        settings: Settings,
        inputText: string, 
        inputFiles: File[], 
        databaseSchema: DatabaseSchema,
        currentContent: object,
        refinementInstruction: string
    ) => {
        const responseSchema = buildAiSchema(databaseSchema);

        const responseText = settings.aiProvider === 'gemini'
            ? await refineWithGemini(settings.aiApiKey, settings.selectedModel, refinementInstruction, inputText, inputFiles, currentContent, responseSchema)
            : await refineWithOpenRouter(settings.aiApiKey, settings.selectedModel, refinementInstruction, inputText, inputFiles, currentContent, responseSchema);
        
        let parsedContent;
        try {
            // The AI response might be wrapped in markdown (e.g., ```json ... ```),
            // so we extract the JSON object from the string.
            const startIndex = responseText.indexOf('{');
            const endIndex = responseText.lastIndexOf('}');
            if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
                throw new Error("No valid JSON object found in the AI response.");
            }
            const jsonString = responseText.substring(startIndex, endIndex + 1);
            parsedContent = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse refined AI response:", responseText);
            throw new Error("The AI returned an invalid refined response. Please check the instruction and try again.");
        }

        if (!parsedContent.pageContent || typeof parsedContent.pageContent !== 'object') {
            parsedContent.pageContent = { summaryTitle: 'Summary (auto-generated)', summaryBody: '', takeaways: [] };
        }

        return parsedContent;
    }, []);

    return {
        processContent,
        refineContent,
    }
};