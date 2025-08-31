/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ContentInputCard } from '../components/ContentInputCard';
import { OutputPreview } from '../components/OutputPreview';
import { useAI } from '../hooks/useAI';
import { useAppContext } from '../state/AppContext';

export const ContentInputPage = () => {
    const {
        appState,
        dispatch,
        settings,
        activeDatabaseSchema,
        notion,
        setCurrentPage,
        setActiveDatabaseId,
        setInputText,
        handleAddFiles,
        handleRemoveFile,
        setProcessedContent,
        resetInput,
    } = useAppContext();

    const ai = useAI();
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
            const result = await ai.processContent(settings, appState.inputText, appState.inputFiles, activeDatabaseSchema);
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
        if (!appState.processedContent || !activeDatabaseSchema) return;
        dispatch({ type: 'SET_STATUS', payload: 'refiningAI' });
        try {
            const result = await ai.refineContent(settings, appState.inputText, appState.inputFiles, activeDatabaseSchema, appState.processedContent, instruction);
            const transformedResult = { ...result };
            for (const [key, value] of Object.entries(transformedResult)) {
                const schemaDetails = activeDatabaseSchema[key];
                if (schemaDetails && schemaDetails.type === 'date' && value === 'NOW') {
                    transformedResult[key] = (appState.processedContent[key] as string) || new Date().toISOString().split('T')[0];
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
        if (!appState.processedContent || !activeConnection || !activeDatabaseSchema) return;
        await notion.uploadToNotion(activeConnection, appState.processedContent, activeDatabaseSchema, appState.inputText, appState.inputFiles, appState.publicUrls);
        // Check for error state from the reducer after the async operation
        if (!appState.error) {
            resetInput();
        }
    };
    
    return (
        <>
            <div className="card">
                 <div className="form-group">
                    <label htmlFor="db-selector">
                        <span className="step-number">A</span>
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
                    inputText={appState.inputText} setInputText={setInputText}
                    inputFiles={appState.inputFiles} handleAddFiles={handleAddFiles} handleRemoveFile={handleRemoveFile}
                    onProcess={handleProcess}
                    aiProvider={settings.aiProvider}
                    aiApiKey={settings.aiApiKey}
                    status={appState.status}
                    onValidationError={handleValidationError}
                />
            </div>
            
            {appState.processedContent && activeDatabaseSchema && (
                <OutputPreview
                    processedContent={appState.processedContent} setProcessedContent={setProcessedContent}
                    filePreviews={appState.filePreviews} databaseSchema={activeDatabaseSchema}
                    onUpload={handleUpload} status={appState.status}
                    onRefine={handleRefine}
                />
            )}
        </>
    );
};