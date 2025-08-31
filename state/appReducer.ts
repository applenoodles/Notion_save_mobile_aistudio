/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ProcessedContentData } from "../types";
import type { Page } from "../App";

// --- STATE MANAGEMENT (REDUCER) ---
export type AppStatus = 'idle' | 'fetchingSchema' | 'processingAI' | 'refiningAI' | 'uploadingNotion';

export interface AppState {
  // App status
  status: AppStatus;
  error: string;
  successMessage: string;
  currentPage: Page;

  // Input content state
  inputText: string;
  inputFiles: File[];
  filePreviews: string[];
  publicUrls: (string | null)[];
  processedContent: ProcessedContentData | null;
}

export type AppAction =
  | { type: 'SET_STATUS'; payload: AppStatus }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_SUCCESS'; payload: string }
  | { type: 'RESET_MESSAGES' }
  | { type: 'SET_CURRENT_PAGE'; payload: Page }
  | { type: 'SET_INPUT_TEXT'; payload: string }
  | { type: 'ADD_FILES'; payload: { files: File[], previews: string[], urls: (string | null)[] } }
  | { type: 'REMOVE_FILE'; payload: number }
  | { type: 'SET_PROCESSED_CONTENT'; payload: ProcessedContentData | null }
  | { type: 'RESET_INPUT' };

export const initialState: AppState = {
  status: 'idle',
  error: '',
  successMessage: '',
  currentPage: 'settings',
  inputText: '',
  inputFiles: [],
  filePreviews: [],
  publicUrls: [],
  processedContent: null,
};

export const appStateReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.payload, error: '', successMessage: '' };
    case 'SET_ERROR':
      return { ...state, status: 'idle', error: action.payload };
    case 'SET_SUCCESS':
      return { ...state, status: 'idle', successMessage: action.payload };
    case 'RESET_MESSAGES':
      return { ...state, error: '', successMessage: '' };
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_INPUT_TEXT':
      return { ...state, inputText: action.payload };
    case 'ADD_FILES':
      return {
        ...state,
        inputFiles: [...state.inputFiles, ...action.payload.files],
        filePreviews: [...state.filePreviews, ...action.payload.previews],
        publicUrls: [...state.publicUrls, ...action.payload.urls],
      };
    case 'REMOVE_FILE':
      // Also revoke object URL for image previews to prevent memory leaks
      const previewUrl = state.filePreviews[action.payload];
      if (previewUrl && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
      }
      return {
        ...state,
        inputFiles: state.inputFiles.filter((_, i) => i !== action.payload),
        filePreviews: state.filePreviews.filter((_, i) => i !== action.payload),
        publicUrls: state.publicUrls.filter((_, i) => i !== action.payload),
      };
    case 'SET_PROCESSED_CONTENT':
      return { ...state, processedContent: action.payload };
    case 'RESET_INPUT':
      // Revoke all object URLs before clearing
      state.filePreviews.forEach(url => {
        if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
      });
      return {
        ...state,
        inputText: '',
        inputFiles: [],
        filePreviews: [],
        publicUrls: [],
        processedContent: null,
      };
    default:
      return state;
  }
};

export type AppDispatch = React.Dispatch<AppAction>;
