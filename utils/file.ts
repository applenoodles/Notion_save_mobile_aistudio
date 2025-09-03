/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import JSZip from 'jszip';

export const fileToText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const fileToGenerativePart = async (file: File) => {
  // For image and text files that Gemini can handle directly
  if (file.type.startsWith('image/') || file.type.startsWith('text/')) {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
  }
  // For DOCX files, extract text using mammoth.js
  else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return { text: `Content from DOCX file (${file.name}):\n\n${result.value}` };
  }
  // For XLSX files, extract text using xlsx (SheetJS)
  else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = xlsx.read(arrayBuffer, { type: 'buffer' });
    let fullText = '';
    workbook.SheetNames.forEach(sheetName => {
        fullText += `Sheet: ${sheetName}\n\n`;
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = xlsx.utils.sheet_to_csv(worksheet);
        fullText += sheetData + '\n\n';
    });
    return { text: `Content from XLSX file (${file.name}):\n\n${fullText}` };
  }
  // For PPTX files, extract text using jszip
  else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slidePromises: Promise<string>[] = [];
    zip.folder('ppt/slides').forEach((relativePath, file) => {
        if (relativePath.startsWith('slide') && relativePath.endsWith('.xml')) {
            slidePromises.push(file.async('text'));
        }
    });
    const slideXmls = await Promise.all(slidePromises);
    let fullText = '';
    const textExtractorRegex = /<a:t>(.*?)<\/a:t>/g;
    slideXmls.forEach((xml, index) => {
        fullText += `Slide ${index + 1}:\n`;
        const matches = [...xml.matchAll(textExtractorRegex)];
        matches.forEach(match => {
            fullText += match[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') + ' ';
        });
        fullText += '\n\n';
    });
    return { text: `Content from PPTX file (${file.name}):\n\n${fullText}` };
  }
  // For other unsupported files, provide a placeholder text
  else {
    return { text: `[Unsupported file type: ${file.name} (${file.type})]` };
  }
};
