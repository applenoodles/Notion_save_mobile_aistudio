/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ContentInputCard } from '../components/ContentInputCard';
import { OutputPreview } from '../components/OutputPreview';
import type { ProcessedContentData } from '../types';
import { useAI } from '../hooks/useAI';
import { useFileHandler } from '../hooks/useFileHandler';
import { useAppContext } from '../state/AppContext';

export const ContentInputPage = () => {
    const { appState, dispatch, settings, activeDatabaseSchema, notion, setCurrentPage, setActiveDatabaseId } = useAppContext();
    const ai = useAI();
    const fileHandler = useFileHandler();
    const [processedContent, setProcessedContent] = useState<ProcessedContentData | null>(null);

    const activeConnection = settings.connections.find(c => c.id === settings.activeDatabaseId);
    
    const handleValidationError = (message: string) => {
        dispatch({ type: 'SET_ERROR', payload: message });
    };

    const handleProcess = async () => {
        if (!activeDatabaseSchema) {
            dispatch({ type: 'SET_ERROR', payload: 'Please select a valid database before processing.' });
            return;
        }
        dispatch({ type: 'SET_STATUS', payload: 'processingAI' });
        setProcessedContent(null);
        try {
            const result = await ai.processContent(settings, fileHandler.inputText, fileHandler.inputFiles, activeDatabaseSchema);
            const transformedResult = { ...result };
            for (const [key, value] of Object.entries(transformedResult)) {
                const schemaDetails = activeDatabaseSchema[key];
                if (schemaDetails && schemaDetails.type === 'date' && value === 'NOW') {
                    transformedResult[key] = new Date().toISOString().split('T')[0];
                }
            }
            setProcessedContent(transformedResult);
            dispatch({ type: 'SET_STATUS', payload: 'idle' });
        } catch (e: any) {
            console.error(e);
            dispatch({ type: 'SET_ERROR', payload: e.message || 'Failed to process content with the AI.' });
        }
    };

    const handleRefine = async (instruction: string) => {
        if (!processedContent || !activeDatabaseSchema) return;
        dispatch({ type: 'SET_STATUS', payload: 'refiningAI' });
        try {
            const result = await ai.refineContent(settings, fileHandler.inputText, fileHandler.inputFiles, activeDatabaseSchema, processedContent, instruction);
            const transformedResult = { ...result };
            for (const [key, value] of Object.entries(transformedResult)) {
                const schemaDetails = activeDatabaseSchema[key];
                if (schemaDetails && schemaDetails.type === 'date' && value === 'NOW') {
                    transformedResult[key] = (processedContent[key] as string) || new Date().toISOString().split('T')[0];
                }
            }
            setProcessedContent(transformedResult);
        } catch (e: any) {
            console.error(e);
            dispatch({ type: 'SET_ERROR', payload: e.message || 'Failed to refine content.' });
        } finally {
            dispatch({ type: 'SET_STATUS', payload: 'idle' });
        }
    };

    const handleUpload = async () => {
        if (!processedContent || !activeConnection || !activeDatabaseSchema) return;
        await notion.uploadToNotion(activeConnection, processedContent, activeDatabaseSchema, fileHandler.inputText, fileHandler.inputFiles, fileHandler.publicUrls);
        if (!appState.error) {
            fileHandler.resetFiles();
            setProcessedContent(null);
        }
    };
    
    if (settings.connections.length === 0) {
        return (
             <div className="card">
                <h2>No Databases Found</h2>
                <p>Please add a Notion database connection in the settings page before proceeding.</p>
                 <div className="page-navigation" style={{ justifyContent: 'flex-start', marginTop: '1.5rem' }}>
                    <button className="secondary-button" onClick={() => setCurrentPage('settings')}>
                        &larr; Go to Settings
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="card">
                 <div className="form-group">
                    <label htmlFor="db-selector">
                        <span className="step-number" style={{ width: '20px', height: '20px', fontSize: '0.7rem' }}>A</span>
                        Select Target Database
                    </label>
                    <select id="db-selector" value={settings.activeDatabaseId ?? ''} onChange={(e) => setActiveDatabaseId(e.target.value || null)}>
                        <option value="">-- Please select a database --</option>
                        {settings.connections.map(conn => (
                            <option key={conn.id} value={conn.id}>{conn.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={`card`}>
                 <ContentInputCard
                    inputText={fileHandler.inputText} setInputText={fileHandler.setInputText}
                    inputFiles={fileHandler.inputFiles} handleAddFiles={fileHandler.handleAddFiles} handleRemoveFile={fileHandler.handleRemoveFile}
                    onProcess={handleProcess}
                    aiProvider={settings.aiProvider}
                    aiApiKey={settings.aiApiKey}
                    status={appState.status}
                    onValidationError={handleValidationError}
                />
            </div>
            
            {processedContent && activeDatabaseSchema && (
                <OutputPreview
                    processedContent={processedContent} setProcessedContent={setProcessedContent}
                    filePreviews={fileHandler.filePreviews} databaseSchema={activeDatabaseSchema}
                    onUpload={handleUpload} status={appState.status}
                    onRefine={handleRefine}
                />
            )}
            <div className="page-navigation" style={{ justifyContent: 'flex-start', marginTop: processedContent ? '1.5rem' : '1.5rem' }}>
                <button className="secondary-button" onClick={() => setCurrentPage('system-prompt')}>
                    &larr; Back to System Prompt
                </button>
            </div>
        </>
    );
};