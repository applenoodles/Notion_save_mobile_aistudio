/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useReducer, useState, useCallback, useEffect, useMemo } from 'react';
import { appStateReducer, initialState, AppState, AppDispatch } from "../state/appReducer";
import { useSettings } from '../hooks/useSettings';
import { useNotion } from "../hooks/useNotion";
import type { DatabaseSchema, Settings, DatabaseConnection, ProcessedContentData } from '../types';
import type { Page } from '../App';

// Helper function to upload a single file.
const uploadFile = async (file: File): Promise<string | null> => {
    try {
        const response = await fetch(`/api/uploadFile?filename=${encodeURIComponent(file.name)}`, {
            method: 'POST',
            body: file,
        });
        if (!response.ok) {
            console.error('Upload failed:', await response.text());
            return null;
        }
        const blob = await response.json();
        return blob.url;
    } catch (error) {
        console.error('Error uploading file:', error);
        return null;
    }
};

type NotionHook = ReturnType<typeof useNotion>;

interface AppContextType {
    // State
    appState: AppState;
    settings: Settings;
    activeDatabaseSchema: DatabaseSchema | null;
    isConnected: boolean;

    // Actions
    dispatch: AppDispatch;
    addConnection: (connection: Omit<DatabaseConnection, 'id'>) => void;
    removeConnection: (id: string) => void;
    setActiveDatabaseId: (id: string | null) => void;
    updateAiSetting: (key: keyof Settings, value: string) => void;
    handleClearSettings: () => void;
    setCurrentPage: (page: Page) => void;
    setInputText: (text: string) => void;
    handleAddFiles: (files: File[]) => Promise<void>;
    handleRemoveFile: (index: number) => void;
    setProcessedContent: (content: ProcessedContentData | null) => void;
    resetInput: () => void;

    // Hook results
    notion: NotionHook;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [appState, dispatch] = useReducer(appStateReducer, initialState);
    const [activeDatabaseSchema, setActiveDatabaseSchema] = useState<DatabaseSchema | null>(null);

    const { settings, addConnection, removeConnection, setActiveDatabaseId, updateAiSetting, clearSettings } = useSettings();
    const notion = useNotion(dispatch);

    // --- Action Dispatchers ---
    const setCurrentPage = useCallback((page: Page) => dispatch({ type: 'SET_CURRENT_PAGE', payload: page }), []);
    const setInputText = useCallback((text: string) => dispatch({ type: 'SET_INPUT_TEXT', payload: text }), []);
    const setProcessedContent = useCallback((content: ProcessedContentData | null) => dispatch({ type: 'SET_PROCESSED_CONTENT', payload: content }), []);
    const handleRemoveFile = useCallback((index: number) => dispatch({ type: 'REMOVE_FILE', payload: index }), []);
    const resetInput = useCallback(() => dispatch({ type: 'RESET_INPUT' }), []);

    const handleAddFiles = useCallback(async (newFiles: File[]) => {
        const startIndex = appState.inputFiles.length;
        const previews = newFiles.map(file => file.type.startsWith('image/') ? URL.createObjectURL(file) : '');
        const placeholderUrls = newFiles.map(() => null);
        
        dispatch({ type: 'ADD_FILES', payload: { files: newFiles, previews, urls: placeholderUrls } });

        const settledUrls = await Promise.all(newFiles.map(file => uploadFile(file)));

        dispatch({ type: 'UPDATE_UPLOADED_URLS', payload: { startIndex, urls: settledUrls } });

    }, [appState.inputFiles.length]);

    const handleClearSettings = () => {
        clearSettings();
        setActiveDatabaseSchema(null);
        setCurrentPage('settings');
        dispatch({ type: 'RESET_MESSAGES' });
    };

    // Effect to fetch schema when active database changes
    useEffect(() => {
        const fetchActiveSchema = async () => {
            if (settings.activeDatabaseId) {
                const activeConnection = settings.connections.find(c => c.id === settings.activeDatabaseId);
                if (activeConnection) {
                    const schema = await notion.handleFetchSchema(activeConnection.notionApiKey, activeConnection.notionDatabaseId, true);
                    setActiveDatabaseSchema(schema);
                } else {
                    setActiveDatabaseSchema(null);
                }
            } else {
                setActiveDatabaseSchema(null);
            }
        };
        fetchActiveSchema();
    }, [settings.activeDatabaseId, settings.connections, notion]);

    const isConnected = settings.connections.length > 0 && !!settings.activeDatabaseId;

    const value: AppContextType = useMemo(() => ({
        appState,
        settings,
        activeDatabaseSchema,
        isConnected,
        dispatch,
        addConnection,
        removeConnection,
        setActiveDatabaseId,
        updateAiSetting,
        handleClearSettings,
        setCurrentPage,
        setInputText,
        handleAddFiles,
        handleRemoveFile,
        setProcessedContent,
        resetInput,
        notion,
    }), [appState, settings, activeDatabaseSchema, isConnected, addConnection, removeConnection, setActiveDatabaseId, updateAiSetting, handleAddFiles, handleRemoveFile, setProcessedContent, resetInput, notion, setCurrentPage]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};