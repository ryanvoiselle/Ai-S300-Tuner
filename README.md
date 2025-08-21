# Hondata AI Tuning Assistant (Serverless Desktop App)

This is a desktop application that uses a local, offline AI model to analyze Hondata S300 datalogs and provide expert tuning advice. It is designed for privacy, performance, and simplicity, with a built-in AI engine that requires no external software.

## Features

-   **100% Serverless & Offline:** Uses an embedded AI engine (`node-llama-cpp`) to run analysis locally. No data ever leaves your machine.
-   **One-Click AI Setup:** The app automatically downloads the required AI model on the first run. No need to install Ollama or other server software.
-   **Datalog Analysis:** Upload `.csv` datalogs from Hondata SManager.
-   **Base Map Integration:** Upload your `.skl` base map for more specific tuning advice.
-   **AI-Powered Suggestions:** Get detailed feedback on fuel, ignition, and other engine parameters.
-   **Test Environment:** Generate simulated datalogs to test the AI's capabilities.

---

## Installation (Windows)

Installation is simple. Just run the installer, and the application will handle the rest.

1.  Go to the [**GitHub Releases**](https://github.com/your-username/your-repo/releases) page for this project.
2.  Download the latest installer, which will be named something like `HondataAITuningAssistant-Setup-1.0.0.exe`.
3.  Run the installer. A shortcut will be created on your desktop.
4.  Launch the application.
5.  On the first launch, the app will prompt you to download the AI model file. This is a one-time download of a few gigabytes. Click "Download" and wait for it to complete.
6.  Once the model is downloaded, you're ready to start tuning!

---

## For Developers: Building from Source

### Prerequisites

-   [Node.js](https://nodejs.org/) (which includes `npm`)

### Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/your-repo.git
    cd your-repo
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

### Running in Development Mode

1.  **Build the application:** This is required to compile the CSS and TypeScript/React code.
    ```sh
    npm run build
    ```

2.  **Start the application:**
    ```sh
    npm start
    ```

### Building the Executable

To build the distributable `.exe` file for Windows:

```sh
npm run dist
```

The output will be located in the `dist/` directory, ready for distribution.
