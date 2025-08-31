# Intellectual Notion Save

An intelligent application to process files and text with AI and save structured notes directly to your Notion database.

This project is built as a Progressive Web App (PWA), allowing for installation on mobile devices and seamless integration with native sharing capabilities.

## Features

- **AI-Powered Content Processing**: Leverages AI models (configurable between Google Gemini and OpenRouter) to analyze text and files, extracting structured information based on your Notion database schema.
- **Multi-Format File Support**: Upload and process various file types, including `.txt`, `.md`, `.pdf`, `.docx`, and images (`.png`, `.jpg`).
- **Dynamic Notion Schema Recognition**: Automatically fetches and adapts to the properties of your selected Notion database.
- **Cloud File Uploads**: Files are securely uploaded to Vercel Blob storage, with their public URLs embedded directly into your Notion pages.
- **Progressive Web App (PWA)**: Installable on both desktop and mobile devices for an app-like experience.
- **Mobile Share Target**: Share files directly from your phone's file manager or gallery to the application, automatically adding them to the input list.
- **Persistent State**: User-inputted text and files are preserved even when navigating between pages, thanks to global state management.
- **Persistent Settings**: Securely stores Notion and AI API keys, as well as database connections, in the browser's local storage for convenience.

## Tech Stack

- **Frontend**: React, Vite, TypeScript
- **Deployment & Backend**: Vercel (including Serverless Functions for uploads)
- **Storage**: Vercel Blob
- **Core APIs**: Notion API, Google Gemini / OpenRouter API

## Local Development

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd intellectual-notion-save
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Deployment

This project is configured for continuous deployment on Vercel. Every push to the `main` branch will automatically trigger a new build and deployment.