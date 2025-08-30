/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from "react";

export const useFileHandler = () => {
    const [inputText, setInputText] = useState('');
    const [inputFiles, setInputFiles] = useState<File[]>([]);
    const [filePreviews, setFilePreviews] = useState<string[]>([]);

    const handleAddFiles = useCallback((newFiles: File[]) => {
        const filesArray = newFiles;
        setInputFiles(prev => [...prev, ...filesArray]);
        filesArray.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setFilePreviews(prev => [...prev, reader.result as string]);
                reader.readAsDataURL(file);
            } else {
                setFilePreviews(prev => [...prev, '']);
            }
        });
    }, []);

    const handleRemoveFile = useCallback((indexToRemove: number) => {
        setInputFiles(prev => prev.filter((_, index) => index !== indexToRemove));
        setFilePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    }, []);

    const resetFiles = useCallback(() => {
        setInputText('');
        setInputFiles([]);
        setFilePreviews([]);
    }, []);

    return {
        inputText,
        setInputText,
        inputFiles,
        filePreviews,
        handleAddFiles,
        handleRemoveFile,
        resetFiles,
    };
};
