/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, memo } from "react";

interface DropZoneProps {
    onFilesSelect: (files: File[]) => void;
    onValidationError: (message: string) => void;
}

const ALLOWED_MIME_TYPES = new Set([
    'text/plain',
    'text/markdown',
    'image/png',
    'image/jpeg',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
]);

const acceptedFileExtensions = ".txt,.md,.png,.jpg,.jpeg,.pdf,.docx,.xlsx,.pptx";


export const DropZone = memo(({ onFilesSelect, onValidationError }: DropZoneProps) => {
    const [isOver, setIsOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const processFiles = useCallback((files: FileList | null) => {
        if (!files) return;

        const filesArray = Array.from(files);
        const acceptedFiles: File[] = [];
        const rejectedFiles: File[] = [];

        filesArray.forEach(file => {
            if (ALLOWED_MIME_TYPES.has(file.type)) {
                acceptedFiles.push(file);
            } else {
                rejectedFiles.push(file);
            }
        });

        if (rejectedFiles.length > 0) {
            const rejectedNames = rejectedFiles.map(f => f.name).join(', ');
            onValidationError(`Unsupported file type(s): ${rejectedNames}. Please upload only supported file types.`);
        }

        if (acceptedFiles.length > 0) {
            onFilesSelect(acceptedFiles);
        }
    }, [onFilesSelect, onValidationError]);


    const handleDragOver = useCallback((event: React.DragEvent) => { event.preventDefault(); setIsOver(true); }, []);
    const handleDragLeave = useCallback((event: React.DragEvent) => { event.preventDefault(); setIsOver(false); }, []);
    const handleDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        setIsOver(false);
        processFiles(event.dataTransfer.files);
    }, [processFiles]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(event.target.files);
        // Reset the input value to allow selecting the same file again
        if (event.target) {
            event.target.value = '';
        }
    };

    return (
        <div
            className={`drop-zone ${isOver ? 'drop-zone--over' : ''}`}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
        >
            <input type="file" ref={inputRef} onChange={handleFileChange} style={{ display: 'none' }}
                accept={acceptedFileExtensions}
                multiple
            />
            <p>Drag & drop files here, or click to select files.</p>
            <p style={{fontSize: '0.8rem', color: 'var(--subtle-text-color)', marginTop: '0.5rem'}}>
                Supported: .txt, .md, .png, .jpg, .pdf, .docx, .xlsx, .pptx
            </p>
        </div>
    );
});