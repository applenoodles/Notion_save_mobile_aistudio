/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- STATE MANAGEMENT (REDUCER) ---
export type AppStatus = 'idle' | 'fetchingSchema' | 'processingAI' | 'refiningAI' | 'uploadingNotion';

export interface AppState {
  status: AppStatus;
  error: string;
  successMessage: string;
}

export type AppAction =
  | { type: 'SET_STATUS'; payload: AppStatus }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_SUCCESS'; payload: string }
  | { type: 'RESET' };

export const initialState: AppState = { status: 'idle', error: '', successMessage: '' };

export const appStateReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.payload, error: '', successMessage: '' };
    case 'SET_ERROR':
      return { ...state, status: 'idle', error: action.payload, successMessage: '' };
    case 'SET_SUCCESS':
      return { ...state, status: 'idle', successMessage: action.payload, error: '' };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

export type AppDispatch = React.Dispatch<AppAction>;
