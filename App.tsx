/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { NavigationMenu } from "./components/NavigationMenu";
import { SettingsPage } from './pages/SettingsPage';
import { SystemPromptPage } from './pages/SystemPromptPage';
import { ContentInputPage } from './pages/ContentInputPage';
import { useAppContext } from "./state/AppContext";

export type Page = 'settings' | 'system-prompt' | 'content-input';

export const App = () => {
  const { appState, setCurrentPage, isConnected } = useAppContext();

  const renderCurrentPage = () => {
    // This is a fallback to ensure users can't access pages before connecting.
    if (appState.currentPage !== 'settings' && appState.currentPage !== 'content-input' && !isConnected) {
        return <SettingsPage />;
    }

    switch(appState.currentPage) {
        case 'settings':
            return <SettingsPage />;
        case 'system-prompt':
            return <SystemPromptPage />;
        case 'content-input':
            return <ContentInputPage />;
        default:
            return <SettingsPage />;
    }
  };

  return (
    <>
      <NavigationMenu 
        currentPage={appState.currentPage} 
        setCurrentPage={setCurrentPage}
        isConnectionReady={isConnected}
      />
      <div className="container">
        <header>
          <h1>IntellectaNote for Notion</h1>
          <p>Intelligently process files with AI and save structured notes directly to your Notion database.</p>
        </header>

        {appState.error && <div className="error-message" role="alert">{appState.error}</div>}
        {appState.successMessage && <div className="success-message" role="alert">{appState.successMessage}</div>}
        
        {renderCurrentPage()}
      </div>
    </>
  );
};