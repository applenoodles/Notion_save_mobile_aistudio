/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AI_PROVIDERS, AiProviderKey } from '../types';
import { useAppContext } from "../state/AppContext";

export const SettingsPage = () => {
    const { 
        settings, 
        updateAiSetting,
        addConnection,
        removeConnection,
        handleClearSettings, 
        appState, 
        notion,
        setCurrentPage
    } = useAppContext();
    
    const [newName, setNewName] = useState('');
    const [newApiKey, setNewApiKey] = useState('');
    const [newDbId, setNewDbId] = useState('');
    const [newSystemPrompt, setNewSystemPrompt] = useState('');

    const isConnecting = appState.status === 'fetchingSchema';

    const handleDatabaseIdChange = (value: string) => {
        const match = value.match(/([a-fA-F0-9]{32})/);
        const extractedId = match ? match[0] : value;
        setNewDbId(extractedId);
    };

    const handleAddConnection = async (e: React.FormEvent) => {
        e.preventDefault();
        const schema = await notion.handleFetchSchema(newApiKey, newDbId);
        if (schema) {
            addConnection({ name: newName, notionApiKey: newApiKey, notionDatabaseId: newDbId, systemPrompt: newSystemPrompt });
            setNewName('');
            setNewApiKey('');
            setNewDbId('');
            setNewSystemPrompt('');
        }
    };

    return (
        <>
            <div className="card">
                <h2><span className="step-number">1</span> Manage Connections</h2>
                
                <div className="warning">
                    <p><strong>Warning:</strong> This demo app stores API keys in your browser's local storage. Do not use this method in a production application.</p>
                </div>

                <form onSubmit={handleAddConnection}>
                    <h4>Add New Database</h4>
                    <div className="form-group">
                        <label htmlFor="new-db-name">Friendly Name</label>
                        <input type="text" id="new-db-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., My Work Notes" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="notion-api-key">
                            Notion API Key 
                            <a href="https://www.notion.so/profile/integrations/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', marginLeft: '8px' }}>
                                (Get Key Here)
                            </a>
                        </label>
                        <input type="password" id="notion-api-key" value={newApiKey} onChange={(e) => setNewApiKey(e.target.value)} placeholder="e.g., secret_..." required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="notion-db-id">Notion Database ID / URL</label>
                        <input type="text" id="notion-db-id" value={newDbId} onChange={(e) => handleDatabaseIdChange(e.target.value)} placeholder="Paste Notion database URL or ID" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="db-system-prompt">Database-Specific System Prompt (Optional)</label>
                        <textarea 
                            id="db-system-prompt"
                            className="input-textarea"
                            value={newSystemPrompt}
                            onChange={(e) => setNewSystemPrompt(e.target.value)}
                            placeholder="If provided, this prompt will be used for this database instead of the global one."
                            style={{ height: '120px', fontSize: '0.9rem' }}
                        />
                    </div>
                    <button type="submit" disabled={isConnecting || !newName || !newApiKey || !newDbId}>
                        {isConnecting && <span className="loader"></span>}
                        {isConnecting ? 'Verifying...' : 'Verify & Add Database'}
                    </button>
                </form>

                {settings.connections.length > 0 && (
                    <>
                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '2rem 0 1.5rem' }} />
                        <h4>Saved Databases</h4>
                        <ul className="file-list" style={{margin: 0}}>
                            {settings.connections.map(conn => (
                                <li key={conn.id} className="file-list-item">
                                    <span><strong>{conn.name}</strong> (ID: ...{conn.notionDatabaseId.slice(-6)})</span>
                                    <button className="remove-file-btn" onClick={() => removeConnection(conn.id)} title="Delete Connection">&times;</button>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
            
            <div className="card">
                 <h2>AI Provider Settings</h2>
                 <div className="form-group">
                    <label htmlFor="ai-provider">AI Provider</label>
                    <select id="ai-provider" value={settings.aiProvider} onChange={(e) => updateAiSetting('aiProvider', e.target.value as AiProviderKey)}>
                        {Object.entries(AI_PROVIDERS).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="ai-api-key">
                        {settings.aiProvider === 'gemini' ? 'Gemini API Key (Optional)' : 'API Key'}
                    </label>
                    <input
                        type="password"
                        id="ai-api-key"
                        value={settings.aiApiKey}
                        onChange={(e) => updateAiSetting('aiApiKey', e.target.value)}
                        placeholder={settings.aiProvider === 'gemini' ? 'Defaults to built-in key if empty' : `Enter your ${AI_PROVIDERS[settings.aiProvider].name} API key`}
                        aria-required={settings.aiProvider !== 'gemini'}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="ai-model">Model</label>
                    <select id="ai-model" value={settings.selectedModel} onChange={(e) => updateAiSetting('selectedModel', e.target.value)}>
                        {AI_PROVIDERS[settings.aiProvider].models.map(model => <option key={model} value={model}>{model}</option>)}
                    </select>
                </div>
                 <div className="button-group" style={{ marginTop: '0.75rem' }}>
                    <button className="secondary-button" style={{ backgroundColor: 'var(--danger-color)' }} onClick={handleClearSettings}>Clear All Saved Settings</button>
                </div>
            </div>

            {settings.connections.length > 0 && (
                 <div className="page-navigation" style={{ justifyContent: 'flex-end' }}>
                    <button onClick={() => setCurrentPage('system-prompt')}>
                        Next Step: System Prompt &rarr;
                    </button>
                </div>
            )}
        </>
    );
};