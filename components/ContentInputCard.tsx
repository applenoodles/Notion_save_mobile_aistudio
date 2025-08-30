/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo } from "react";
import { DropZone } from './DropZone';
import type { AiProviderKey } from '../types';
import type { AppStatus } from '../state/appReducer';

interface ContentInputCardProps {
    inputText: string; 
    setInputText: (v: string) => void;
    inputFiles: File[]; 
    handleAddFiles: (f: File[]) => void; 
    handleRemoveFile: (i: number) => void;
    onProcess: () => void; 
    aiProvider: AiProviderKey; 
    aiApiKey: string; 
    status: AppStatus;
    onValidationError: (message: string) => void;
}

export const ContentInputCard = memo(({ inputText, setInputText, inputFiles, handleAddFiles, handleRemoveFile, onProcess, aiProvider, aiApiKey, status, onValidationError }: ContentInputCardProps) => {
    const isProcessing = status === 'processingAI';
    const isBusy = status === 'processingAI' || status === 'refiningAI';
    const isAiReady = aiProvider === 'gemini' || !!aiApiKey;
    return (
        <>
            <h2><span className="step-number" style={{ width: '20px', height: '20px', fontSize: '0.7rem' }}>B</span> Add Content & Process</h2>
            <textarea className="input-textarea" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type or paste any text here..." />
            <DropZone onFilesSelect={handleAddFiles} onValidationError={onValidationError} />
            {inputFiles.length > 0 && (
                <ul className="file-list">
                    {inputFiles.map((file, index) => (
                        <li key={index} className="file-list-item">
                            <span>{file.name}</span>
                            <button className="remove-file-btn" onClick={() => handleRemoveFile(index)}>&times;</button>
                        </li>
                    ))}
                </ul>
            )}
            <button onClick={onProcess} disabled={isBusy || (!inputText && inputFiles.length === 0) || !isAiReady}>
                {isProcessing && <span className="loader"></span>}
                {isProcessing ? 'Processing...' : 'Process with AI'}
            </button>
        </>
    );
});