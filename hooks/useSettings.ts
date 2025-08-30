/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { AI_PROVIDERS, AiProviderKey, Settings, DatabaseConnection } from '../types';
import { DEFAULT_SYSTEM_PROMPT } from '../utils/prompts';

const SETTINGS_STORAGE_KEY = 'intellecta-note-settings-v2';

const initialSettings: Settings = {
    connections: [],
    activeDatabaseId: null,
    aiProvider: 'gemini',
    aiApiKey: '',
    selectedModel: AI_PROVIDERS.gemini.models[0],
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
};

export const useSettings = () => {
    const [settings, setSettings] = useState<Settings>(initialSettings);

    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings) as Partial<Settings>;
                setSettings(prev => ({...prev, ...parsed}));
            }
        } catch (error) {
            console.error("Failed to load settings from local storage:", error);
        }
    }, []);
    
    const saveSettings = useCallback((newSettings: Settings) => {
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
            setSettings(newSettings);
        } catch (error) {
            console.error("Failed to save settings to local storage:", error);
        }
    }, []);

    const addConnection = useCallback((connection: Omit<DatabaseConnection, 'id'>) => {
        setSettings(prev => {
            const newConnection = { ...connection, id: Date.now().toString() };
            const updatedConnections = [...prev.connections, newConnection];
            const newSettings = { ...prev, connections: updatedConnections, activeDatabaseId: newConnection.id };
            saveSettings(newSettings);
            return newSettings;
        });
    }, [saveSettings]);

    const removeConnection = useCallback((id: string) => {
        setSettings(prev => {
            const updatedConnections = prev.connections.filter(c => c.id !== id);
            const newActiveId = prev.activeDatabaseId === id ? (updatedConnections[0]?.id || null) : prev.activeDatabaseId;
            const newSettings = { ...prev, connections: updatedConnections, activeDatabaseId: newActiveId };
            saveSettings(newSettings);
            return newSettings;
        });
    }, [saveSettings]);
    
    const setActiveDatabaseId = useCallback((id: string | null) => {
        setSettings(prev => {
             const newSettings = { ...prev, activeDatabaseId: id };
             saveSettings(newSettings);
             return newSettings;
        });
    }, [saveSettings]);

    const updateAiSetting = useCallback((key: keyof Settings, value: string) => {
        setSettings(prev => {
            const newSettings = { ...prev, [key]: value };
            if (key === 'aiProvider') {
                const newProvider = value as AiProviderKey;
                if (AI_PROVIDERS[newProvider]) {
                    newSettings.selectedModel = AI_PROVIDERS[newProvider].models[0];
                }
            }
            saveSettings(newSettings);
            return newSettings;
        });
    }, [saveSettings]);


    const clearSettings = useCallback(() => {
        try {
            localStorage.removeItem(SETTINGS_STORAGE_KEY);
            setSettings(initialSettings);
        } catch (error) {
            console.error("Failed to clear settings from local storage:", error);
        }
    }, []);
    
    return {
        settings,
        addConnection,
        removeConnection,
        setActiveDatabaseId,
        updateAiSetting,
        clearSettings,
    };
};