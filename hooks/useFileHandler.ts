/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from "react";

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
        return blob.url; // The public URL from Vercel Blob
    } catch (error) {
        console.error('Error uploading file:', error);
        return null;
    }
};

export const useFileHandler = () => {
    const [inputText, setInputText] = useState('');
    const [inputFiles, setInputFiles] = useState<File[]>([]);
    const [filePreviews, setFilePreviews] = useState<string[]>([]);
    const [publicUrls, setPublicUrls] = useState<(string | null)[]>([]);

    const handleAddFiles = useCallback(async (newFiles: File[]) => {
        // Update local state for UI immediately
        setInputFiles(prev => [...prev, ...newFiles]);

        const newPreviews = newFiles.map(file => 
            file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
        );
        setFilePreviews(prev => [...prev, ...newPreviews]);

        // Set placeholder URLs
        setPublicUrls(prev => [...prev, ...newFiles.map(() => null)]);

        // Upload files and update URLs one by one
        // This allows the UI to be responsive while files upload in the background
        const uploadPromises = newFiles.map(file => uploadFile(file));
        const settledUrls = await Promise.all(uploadPromises);

        setPublicUrls(prev => {
            const updatedUrls = [...prev];
            let newUrlIndex = 0;
            for (let i = 0; i < updatedUrls.length; i++) {
                if (updatedUrls[i] === null && newUrlIndex < settledUrls.length) {
                    updatedUrls[i] = settledUrls[newUrlIndex];
                    newUrlIndex++;
                }
            }
            return updatedUrls;
        });

    }, []);

    const handleRemoveFile = useCallback((indexToRemove: number) => {
        const previewUrl = filePreviews[indexToRemove];
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setInputFiles(prev => prev.filter((_, index) => index !== indexToRemove));
        setFilePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
        setPublicUrls(prev => prev.filter((_, index) => index !== indexToRemove));
    }, [filePreviews]);

    const resetFiles = useCallback(() => {
        filePreviews.forEach(url => {
            if (url && url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        });
        setInputText('');
        setInputFiles([]);
        setFilePreviews([]);
        setPublicUrls([]);
    }, [filePreviews]);

    return {
        inputText,
        setInputText,
        inputFiles,
        filePreviews,
        publicUrls, // Expose the new public URLs
        handleAddFiles,
        handleRemoveFile,
        resetFiles,
    };
};
