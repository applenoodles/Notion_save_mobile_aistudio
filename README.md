# Intellectual Notion Save

An intelligent Progressive Web App (PWA) to process files and text with AI and save structured notes directly to your Notion database.

This application allows users to connect to their Notion workspace, select a database, and use AI (Google Gemini or any OpenRouter model) to analyze and structure content. It supports various file formats, preserves user input between sessions, and can be installed on mobile devices to act as a native share target.

## ✨ Features

- **AI-Powered Content Processing**: Leverages AI models to analyze content and extract structured information based on your Notion database schema.
- **Multi-Format File Parsing**: Natively parses text from `.docx`, `.xlsx`, `.pptx`, `.txt`, and `.md` files directly in the browser before sending to the AI.
- **Notion Integration**: Connects directly to your Notion workspace to fetch database schemas and create new pages.
- **PWA & Mobile Share Target**: Installable on mobile devices and can receive files directly from the OS share sheet.
- **Persistent State**: User-inputted text, selected files, and processed content are preserved when navigating between pages.
- **Secure Local Settings**: Stores Notion and AI API keys, as well as database connections, in the browser's `localStorage`.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TypeScript
- **Deployment & Backend**: Vercel (including Serverless Functions)
- **File Storage**: Vercel Blob
- **Core APIs**: Notion API, Google Gemini / OpenRouter API
- **File Parsing**: `mammoth.js` (for .docx), `xlsx` (for .xlsx), `jszip` (for .pptx)

## 📂 Project Structure & File Guide

This guide provides an overview of the key files and directories in the project.

#### `api/`
- **`uploadFile.ts`**: A Vercel Serverless Function that acts as the backend. It receives a file from the frontend, securely uploads it to Vercel Blob storage, and returns its public URL. It includes logic to handle duplicate filenames by adding a random suffix.

#### `components/`
- **`NavigationMenu.tsx`**: Renders the main top-left navigation menu and handles the enabled/disabled state of links based on application state (e.g., if a database is connected).
- **`ContentInputCard.tsx`**: The main UI card for user input, containing the text area and the DropZone.
- **`DropZone.tsx`**: A dedicated component for handling file drag-and-drop and file selection.
- **`OutputPreview.tsx`**: A complex component that displays the AI-processed results. It dynamically renders fields based on the Notion database schema and allows the user to manually edit the results before uploading.
- **`SettingsCard.tsx` / `AiSettingsCard.tsx`**: UI components related to the settings page.

#### `hooks/`
- **`useAI.ts`**: Contains all logic for communicating with AI APIs (Gemini and OpenRouter). It builds the appropriate prompts and schema definitions for the AI.
- **`useNotion.ts`**: Manages all communication with the Notion API. It fetches database schemas and contains the logic to build and create new Notion pages with the final content, including embedded files and links.
- **`useSettings.ts`**: A hook for managing persistent user settings (API keys, database connections) by saving to and loading from the browser's `localStorage`.

#### `pages/`
- **`ContentInputPage.tsx`**: The main page for content input and processing. It composes the `ContentInputCard` and `OutputPreview` components and orchestrates the main user workflow.
- **`SettingsPage.tsx`**: The page where users can manage their Notion database connections and configure AI provider settings.
- **`SystemPromptPage.tsx`**: A page for users to view or edit the system prompt sent to the AI.

#### `public/`
- **`manifest.webmanifest`**: The PWA manifest file. It defines the app's name, icons, and critically, the `share_target` configuration that allows it to appear in the mobile share sheet.
- **`sw.js`**: The Service Worker file. It intercepts the `fetch` event for the share target, extracts the shared files, and sends them to the main application.
- **`icon-*.png`**: Application icons for the PWA.

#### `state/`
- **`appReducer.ts`**: Defines the shape of the global state (`AppState`), all possible state-changing actions (`AppAction`), and the main reducer function (`appStateReducer`) that calculates state changes.
- **`AppContext.tsx`**: The heart of the application. It uses the `appReducer` to create a global state provider. It centralizes all application logic, including state, state-modifying functions, and file upload handling, making this data available to the entire component tree.

#### `utils/`
- **`api.ts`**: Contains a helper function (`handleNotionApiCall`) for Notion API requests, which prepends a CORS proxy URL.
- **`file.ts`**: Contains the crucial `fileToGenerativePart` utility, which inspects a file's MIME type and uses the appropriate library (`mammoth`, `xlsx`, `jszip`) to extract its text content before it's sent to the AI.
- **`formatters.ts`**: Helper functions for formatting data for the UI, such as `formatFileSize` and `getFileEmoji`.
- **`notion.ts`**: Utilities for constructing Notion block objects.
- **`prompts.ts`**: Contains the default system prompt for the AI.

#### Root Files
- **`App.tsx`**: The top-level React component. It renders the `NavigationMenu` and the current page based on the global state.
- **`index.tsx`**: The application's entry point. It renders the `App` component and registers the Service Worker.

## ⚙️ Local Development

1.  **Clone the repository.**
2.  **Install dependencies:** `npm install`
3.  **Run the development server:** `npm run dev`

## 🚀 Deployment

This project is configured for continuous deployment on Vercel. Every push to the `main` branch will automatically trigger a new build and deployment.