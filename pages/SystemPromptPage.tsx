/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppContext } from "../state/AppContext";
import type { Page } from '../App';
import type { Settings } from '../types';

export const SystemPromptPage = () => {
    // Fix: Use 'updateAiSetting' from the context, which was named incorrectly 'updateSetting' in this component.
    const { settings, updateAiSetting, setCurrentPage } = useAppContext();
    return (
        <>
            <div className="card">
                <h2><span className="step-number">2</span> Customize System Prompt</h2>
                <p style={{ color: 'var(--subtle-text-color)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    This is the instruction the AI will follow. You can customize it to better suit your needs.
                </p>
                <div className="form-group">
                    <label htmlFor="system-prompt">AI System Prompt</label>
                    <textarea
                        id="system-prompt"
                        className="input-textarea"
                        value={settings.systemPrompt}
                        // Fix: Use 'updateAiSetting' to update the system prompt setting.
                        onChange={(e) => updateAiSetting('systemPrompt', e.target.value)}
                        style={{ height: '300px', fontSize: '0.9rem', lineHeight: '1.5' }}
                        aria-label="AI System Prompt"
                    />
                </div>
            </div>
            <div className="page-navigation">
                <button className="secondary-button" onClick={() => setCurrentPage('settings')}>
                    &larr; Back to Settings
                </button>
                <button onClick={() => setCurrentPage('content-input')}>
                    Next Step: Add Content &rarr;
                </button>
            </div>
        </>
    );
};
