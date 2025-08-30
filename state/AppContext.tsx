/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useReducer, useState, useCallback, useEffect } from 'react';
import { appStateReducer, initialState, AppState, AppDispatch } from "../state/appReducer";
import { useSettings } from '../hooks/useSettings';
import { useNotion } from "../hooks/useNotion";
import type { DatabaseSchema, Settings, DatabaseConnection } from '../types';
import type { Page } from '../App';

type NotionHook = ReturnType<typeof useNotion>;

interface AppContextType {
    // State
    appState: AppState;
    settings: Settings;
    activeDatabaseSchema: DatabaseSchema | null;
    isConnected: boolean;
    currentPage: Page;

    // Actions
    dispatch: AppDispatch;
    addConnection: (connection: Omit<DatabaseConnection, 'id'>) => void;
    removeConnection: (id: string) => void;
    setActiveDatabaseId: (id: string | null) => void;
    updateAiSetting: (key: keyof Settings, value: string) => void;
    handleClearSettings: () => void;
    setCurrentPage: (page: Page) => void;

    // Hook results
    notion: NotionHook;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [appState, dispatch] = useReducer(appStateReducer, initialState);
    const [currentPage, setCurrentPage] = useState<Page>('settings');
    const [activeDatabaseSchema, setActiveDatabaseSchema] = useState<DatabaseSchema | null>(null);

    const { settings, addConnection, removeConnection, setActiveDatabaseId, updateAiSetting, clearSettings } = useSettings();
    const notion = useNotion(dispatch);

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


    const handleClearSettings = () => {
        clearSettings();
        setActiveDatabaseSchema(null);
        setCurrentPage('settings');
        dispatch({ type: 'RESET' });
    };

    const isConnected = settings.connections.length > 0;

    const value: AppContextType = {
        appState,
        settings,
        activeDatabaseSchema,
        isConnected,
        currentPage,
        dispatch,
        addConnection,
        removeConnection,
        setActiveDatabaseId,
        updateAiSetting,
        handleClearSettings,
        setCurrentPage,
        notion,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};