/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo, useState } from "react";
import type { ProcessedContentData, DatabaseSchema, PageContent } from '../types';
import type { AppStatus } from '../state/appReducer';

interface OutputPreviewProps {
    processedContent: ProcessedContentData;
    setProcessedContent: React.Dispatch<React.SetStateAction<ProcessedContentData | null>>;
    filePreviews: string[];
    databaseSchema: DatabaseSchema;
    onUpload: () => void;
    onRefine: (instruction: string) => Promise<void>;
    status: AppStatus;
}

export const OutputPreview = memo(({ processedContent, setProcessedContent, filePreviews, databaseSchema, onUpload, onRefine, status }: OutputPreviewProps) => {
    const [refinementPrompt, setRefinementPrompt] = useState('');

    const titleKey = Object.keys(databaseSchema).find(key => databaseSchema[key].type === 'title');
    const title = titleKey ? processedContent[titleKey] : "AI Processed Content";
    const isUploading = status === 'uploadingNotion';
    const isRefining = status === 'refiningAI';

    const pageContent = processedContent.pageContent || { summaryTitle: '', summaryBody: '', takeaways: [] };

    const handleFieldChange = (key: string, value: any) => {
        console.log('[OutputPreview] handleFieldChange called', { key, value });
        const newContent = { ...processedContent, [key]: value };
        console.log('[OutputPreview] Setting new processed content:', newContent);
        setProcessedContent(newContent);
    };

    const handlePageContentChange = (key: keyof PageContent, value: any) => {
        console.log('[OutputPreview] handlePageContentChange called', { key, value });
        const currentContent = processedContent.pageContent || { summaryTitle: '', summaryBody: '', takeaways: [] };
        const newContent = { ...processedContent, pageContent: { ...currentContent, [key]: value } };
        console.log('[OutputPreview] Setting new processed content:', newContent);
        setProcessedContent(newContent);
    };

    const handleTakeawayChange = (index: number, newValue: string) => {
        const newTakeaways = [...(pageContent.takeaways || [])];
        newTakeaways[index] = newValue;
        handlePageContentChange('takeaways', newTakeaways);
    };

    const handleRemoveTakeaway = (index: number) => {
        const newTakeaways = (pageContent.takeaways || []).filter((_, i) => i !== index);
        handlePageContentChange('takeaways', newTakeaways);
    };

    const handleAddTakeaway = () => {
        const newTakeaways = [...(pageContent.takeaways || []), ""];
        handlePageContentChange('takeaways', newTakeaways);
    };
    
    const handleRefinementSubmit = async (instruction: string) => {
        if (!instruction.trim() || isRefining) return;
        await onRefine(instruction.trim());
        setRefinementPrompt(''); // Clear input after submission
    };

    const quickActions = [
        { label: 'Make summary concise', instruction: 'Make the summaryBody more concise.' },
        { label: 'Translate to English', instruction: 'Translate all user-generated text values in the JSON to English, including summary, takeaways, and titles.' },
        { label: 'Change tone to professional', instruction: 'Rewrite the text in summaryTitle, summaryBody, and takeaways to have a more professional and formal tone.' },
    ];

    const renderMetadata = () => (
        <div className="output-metadata">
            {Object.entries(processedContent).map(([key, value]) => {
                if (key === 'pageContent' || !databaseSchema[key] || key === titleKey) return null;
                const propDetails = databaseSchema[key];
                let displayValue: React.ReactNode;

                switch (propDetails?.type) {
                    case 'select':
                        displayValue = <div className="list-bar-container">{propDetails.select.options.map(opt => <button key={opt.name} className={`list-bar-option ${value === opt.name ? 'selected' : ''}`} onClick={() => handleFieldChange(key, opt.name)}>{opt.name}</button>)}</div>;
                        break;
                    case 'multi_select':
                        const currentValues = new Set(value as string[]);
                        displayValue = <div className="list-bar-container">{propDetails.multi_select.options.map(opt => <button key={opt.name} className={`list-bar-option ${currentValues.has(opt.name) ? 'selected' : ''}`} onClick={() => { const newValues = new Set(currentValues); newValues.has(opt.name) ? newValues.delete(opt.name) : newValues.add(opt.name); handleFieldChange(key, Array.from(newValues)); }}>{opt.name}</button>)}</div>;
                        break;
                    case 'date':
                        displayValue = <input type="date" value={(value as string) || ''} onChange={(e) => handleFieldChange(key, e.target.value)} />;
                        break;
                    case 'url':
                        displayValue = <input type="url" value={(value as string) || ''} onChange={(e) => handleFieldChange(key, e.target.value)} placeholder="Enter URL" />;
                        break;
                    case 'email':
                        displayValue = <input type="email" value={(value as string) || ''} onChange={(e) => handleFieldChange(key, e.target.value)} placeholder="Enter email" />;
                        break;
                    case 'phone_number':
                        displayValue = <input type="tel" value={(value as string) || ''} onChange={(e) => handleFieldChange(key, e.target.value)} placeholder="Enter phone number" />;
                        break;
                    case 'number':
                         displayValue = <input type="number" value={(value as number) || ''} onChange={(e) => handleFieldChange(key, e.target.value === '' ? null : Number(e.target.value))} />;
                         break;
                    case 'checkbox':
                        displayValue = <input type="checkbox" checked={Boolean(value)} onChange={(e) => handleFieldChange(key, e.target.checked)} style={{ transform: 'scale(1.2)', justifySelf: 'start' }} />;
                        break;
                    case 'rich_text':
                         displayValue = <input type="text" value={(value as string) || ''} onChange={(e) => handleFieldChange(key, e.target.value)} />;
                         break;
                    case 'relation':
                         displayValue = <span style={{ color: 'var(--subtle-text-color)', fontSize: '0.9rem' }}>Relations cannot be set by AI.</span>;
                         break;
                    default:
                        displayValue = value as string;
                }
                return <div className="metadata-item" key={key}><span className="metadata-label">{key}</span><span className="metadata-value">{displayValue}</span></div>;
            })}
        </div>
    );

    return (
        <div className="card output-section">
            <h2>Preview & Edit</h2>
            <div className="output-content">
                <input type="text" className="output-title-input" value={title as string || ''} onChange={(e) => { if (titleKey) handleFieldChange(titleKey, e.target.value) }} aria-label="Page title" />
                {renderMetadata()}
                <div className="file-preview-container">{filePreviews.map((preview, index) => preview && <img key={index} src={preview} alt={`File preview ${index + 1}`} className="file-preview" />)}</div>
                <input type="text" className="output-summary-title-input" value={pageContent.summaryTitle || 'Summary'} onChange={(e) => handlePageContentChange('summaryTitle', e.target.value)} aria-label="Summary title" />
                <textarea className="output-summary-body-textarea" value={pageContent.summaryBody || ''} onChange={(e) => handlePageContentChange('summaryBody', e.target.value)} aria-label="Summary body" />
                <h4>Key Takeaways</h4>
                <ul>{(pageContent.takeaways || []).map((item, index) => <li key={index} className="takeaway-item"><input type="text" value={item} onChange={(e) => handleTakeawayChange(index, e.target.value)} aria-label={`Takeaway ${index + 1}`} /><button className="remove-takeaway-btn" onClick={() => handleRemoveTakeaway(index)} aria-label={`Remove takeaway ${index + 1}`}>&times;</button></li>)}</ul>
                <button className="add-takeaway-btn" onClick={handleAddTakeaway}>+ Add Takeaway</button>
            </div>
             <div className="quick-actions-section">
                <h4>Quick Actions</h4>
                <div className="quick-actions-buttons">
                    {quickActions.map(action => (
                        <button key={action.label} onClick={() => handleRefinementSubmit(action.instruction)} disabled={isRefining} className="secondary-button quick-action-btn">
                            {action.label}
                        </button>
                    ))}
                </div>
                <div className="custom-refinement-group">
                    <input 
                        type="text" 
                        value={refinementPrompt}
                        onChange={(e) => setRefinementPrompt(e.target.value)}
                        placeholder="Or type a custom refinement instruction..."
                        disabled={isRefining}
                        onKeyDown={(e) => e.key === 'Enter' && handleRefinementSubmit(refinementPrompt)}
                    />
                    <button onClick={() => handleRefinementSubmit(refinementPrompt)} disabled={isRefining || !refinementPrompt.trim()}>
                        {isRefining && <span className="loader"></span>}
                        Refine
                    </button>
                </div>
            </div>
            <button onClick={onUpload} disabled={isUploading || isRefining}>{isUploading && <span className="loader"></span>}{isUploading ? 'Uploading...' : 'Upload to Notion'}</button>
        </div>
    );
});
