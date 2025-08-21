# Hondata AI Tuning Assistant (Desktop Application)

This is a desktop application that uses both local and cloud-based AI to analyze Hondata S300 datalogs and provide expert tuning advice. It runs as a standalone application on your computer.

## Features

-   **Dual AI Providers:** Choose between a fully offline, local AI model (Llama 3) or the powerful online Google Gemini API.
-   **No Internet Required (with Local AI):** Download the local model once and perform analyses anywhere, anytime.
-   **Datalog Analysis:** Upload `.csv` datalogs from Hondata SManager.
-   **Base Map Integration:** Upload your `.skl` base map for more specific tuning advice.
-   **AI-Powered Suggestions:** Get detailed feedback on fuel, ignition, and other engine parameters.
-   **Test Environment:** Generate simulated datalogs to test the AI's capabilities on common tuning issues.
-   **Live ECU Connection (Simulated):** UI framework for connecting to an ECU for real-time data or flashing.

---

## For Developers: Building & Running from Source

### Prerequisites

-   [Node.js](https://nodejs.org/) (which includes `npm`)

### Setup & Build

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/your-repo.git
    cd your-repo
    ```

2.  **Install dependencies:**
    This command will download all the necessary packages for the project, including Electron.
    ```sh
    npm install
    ```

3.  **Configure Google Gemini (Optional):**
    To enable the "Google Gemini" AI provider, you must configure Google OAuth credentials.
    -   Follow Google's documentation to create an OAuth 2.0 Client ID for a **Desktop app**.
    -   Open the `electron.js` file.
    -   Replace the placeholder values for `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` with your credentials.
    -   **Important:** Ensure your authorized redirect URI in the Google Cloud Console is set to `http://localhost:5858/callback`, matching the `REDIRECT_URI` constant in the file.

4.  **Build the application assets:**
    This command compiles the application's frontend code and styles into the `dist/` directory.
    ```sh
    npm run build
    ```

### Running the App

After installing dependencies and building the assets, you can run the application in development mode:

```sh
npm start
```

This will launch the Electron application window.
