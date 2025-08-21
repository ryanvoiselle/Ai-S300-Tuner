# Hondata AI Tuning Assistant (Offline Desktop App)

This is a desktop application that uses a local, offline AI model to analyze Hondata S300 datalogs and provide expert tuning advice. It is designed for privacy and performance, with all analysis happening on your own computer.

## Features

- **100% Offline AI:** Uses Ollama and the Llama 3 model to run analysis locally. No data ever leaves your machine.
- **Datalog Analysis:** Upload `.csv` datalogs from Hondata SManager.
- **Base Map Integration:** Upload your `.skl` base map for more specific tuning advice.
- **AI-Powered Suggestions:** Get detailed feedback on fuel, ignition, and other engine parameters.
- **Simulated Map Modification:** Download a new `.skl` file with AI suggestions applied (simulation).
- **Test Environment:** Generate simulated datalogs to test the AI's capabilities.

---

## Installation (Windows)

This application requires a local AI engine to be running on your computer. The installation is a simple two-step process.

### Step 1: Install the AI Engine (Ollama)

1.  Go to the official Ollama website: **[https://ollama.com/](https://ollama.com/)**
2.  Click the "Download" button and run the installer for Windows.
3.  Once installed, open a Command Prompt or PowerShell window and run the following command to download the `llama3` AI model. This may take some time depending on your internet connection.
    ```sh
    ollama pull llama3
    ```
4.  Leave Ollama running in the background. The application needs it to perform the analysis.

### Step 2: Install the Hondata AI Tuning Assistant

1.  Go to the [**GitHub Releases**](https://github.com/your-username/your-repo/releases) page for this project.
2.  Download the latest installer, which will be named something like `HondataAITuningAssistant-Setup-1.0.0.exe`.
3.  Run the installer. A shortcut will be created on your desktop and in your Start Menu.
4.  Launch the application and start tuning!

---

## For Developers: Building from Source

### Prerequisites

-   [Node.js](https://nodejs.org/) (which includes `npm`)
-   [Ollama](https://ollama.com/) installed and running on your machine.
-   The Llama 3 model pulled via `ollama pull llama3`.

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

1.  **Build the application:** This step is required to compile the TypeScript/React code into JavaScript that Electron can understand.
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