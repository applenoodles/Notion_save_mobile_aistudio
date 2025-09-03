# Intellectual Notion Save

"Intellectual Notion Save" is a web application designed to streamline the process of capturing, processing, and organizing information into Notion. Users can input text or upload files, have the content intelligently processed by an AI, and then automatically save the structured output to a specified Notion database.

## ✨ Key Features

- **Flexible Content Input**: Supports both direct text input and file uploads.
- **AI-Powered Processing**: Utilizes a powerful language model to analyze, summarize, or transform your content based on a customizable system prompt.
- **Seamless Notion Integration**: Connects directly to your Notion workspace to fetch databases and save content.
- **Customizable Settings**:
    - **Notion**: Configure your Notion API key and select the target database.
    - **AI**: Adjust the AI model, temperature, and define a system prompt to control the output format and style.
- **Live Preview**: Review the AI-generated output before saving it to Notion.
- **State Persistence**: All your settings are saved locally in your browser for a seamless experience.

## 🚀 Tech Stack

- **Frontend**: React, Vite, TypeScript
- **Styling**: CSS
- **State Management**: React Context API with `useReducer`
- **Backend API**: Vercel Serverless Functions
- **AI**: OpenAI (or compatible) API
- **Deployment**: Vercel

## 📦 Project Structure

```
/
├── api/                    # Vercel Serverless Functions
│   └── uploadFile.ts       # Backend logic for AI processing
├── components/             # Reusable React components
├── hooks/                  # Custom React hooks for business logic
│   ├── useAI.ts            # Logic for interacting with the AI API
│   ├── useNotion.ts        # Logic for interacting with the Notion API
│   └── useSettings.ts      # Logic for managing application state
├── pages/                  # Application pages/views
├── public/                 # Static assets
├── state/                  # Global state management (Context & Reducer)
│   ├── AppContext.tsx
│   └── appReducer.ts
├── utils/                  # Utility functions
│   ├── api.ts
│   ├── file.ts
│   ├── notion.ts
│   └── prompts.ts
├── App.tsx                 # Main application component
├── index.tsx               # Application entry point
└── package.json            # Project dependencies and scripts
```

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18 or later)
- A Vercel account for deployment (or local Vercel CLI)
- A Notion account and an [internal integration token](https://www.notion.so/my-integrations)
- An OpenAI API key (or from a compatible provider)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd intellectual_notion_save
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    The backend API (`api/uploadFile.ts`) requires an API key for the AI service. For Vercel deployment, set this as an environment variable in your Vercel project settings.

    - `VITE_OPENAI_API_KEY`: Your OpenAI API key.

    *Note: The Notion API key is currently managed through the application's UI and stored in `localStorage`. See "Potential Bugs & Improvements" for more details.*

### Running Locally

To run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Deployment

The project is set up for easy deployment on Vercel. Simply connect your Git repository to a new Vercel project. Vercel will automatically detect the Vite configuration and deploy the application and the serverless function.

## 🐞 Potential Bugs & Improvements

Here are some potential issues and areas for improvement identified during the analysis:

1.  **Security Risk with API Key Handling**:
    - **Issue**: The Notion API key is stored in the browser's `localStorage` and sent with each request from the client. Exposing sensitive keys on the client-side is a significant security risk.
    - **Recommendation**: The Notion API key should be managed exclusively on the server-side. The frontend should make requests to a dedicated backend endpoint, which then uses the key (stored as a secure environment variable) to communicate with the Notion API.

2.  **Error Handling**:
    - **Issue**: The application's error handling could be more robust. For example, if an API call to the AI service or Notion fails, the user may not receive clear, actionable feedback.
    - **Recommendation**: Implement a global error notification system (e.g., using toasts) to display meaningful error messages. Add more specific `try...catch` blocks around all `fetch` calls.

3.  **User Experience (UX)**:
    - **Issue**: There is a lack of loading indicators during asynchronous operations like fetching Notion databases, processing content with AI, or saving the output. This can make the application feel unresponsive.
    - **Recommendation**: Add loading spinners or disable buttons during these operations to provide clear visual feedback to the user.

4.  **Large File Processing**:
    - **Issue**: The `api/uploadFile.ts` function appears to read the entire file into memory. This can cause timeouts or memory limit exceptions on serverless platforms when handling large files.
    - **Recommendation**: For larger files, consider implementing a streaming approach for uploads and processing.

5.  **Hardcoded AI Model**:
    - **Issue**: The AI model seems to be hardcoded in the backend function. While there's a setting for the model in the UI, the backend might not be dynamically using it.
    - **Recommendation**: Ensure that the model selected by the user in the frontend is correctly passed to and used by the `api/uploadFile.ts` function when making the call to the AI provider.
