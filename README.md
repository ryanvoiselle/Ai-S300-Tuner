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

## For Users: Easy Installation (Windows)

A PowerShell script is provided to automate the entire setup process. This is the recommended method for most users.

**Instructions:**

1.  **Download:** Download the `install.ps1` script from the latest release on the [GitHub Releases page](https://github.com/your-username/your-repo/releases). (Replace the link with your actual repo).

2.  **Run Script:**
    *   Right-click the downloaded `install.ps1` file.
    *   Select "**Run with PowerShell**".
    *   You must approve any security prompts to allow the script to make changes.

3.  **Troubleshooting Execution Policy:** If you get an error that scripts are disabled on your system, you may need to bypass the execution policy. You can do this by opening PowerShell as an Administrator and running this command:
    ```powershell
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
    ```
    Then, try running the `install.ps1` script again.

**What the script does:**

-   Downloads the latest version of the **Hondata AI Tuning Assistant**.
-   Downloads and installs **Ollama**, the local AI server.
-   Downloads the required `llama3` AI model.
-   Creates a desktop shortcut for the application.

After the script finishes, you will have everything you need. Simply launch the application from your Start Menu.

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

To run the app with live reloading and access to developer tools:

```sh
npm start
```

### Building the Executable

To build the distributable `.exe` file for Windows:

```sh
npm run dist
```

The output will be located in the `dist/` directory, ready for distribution.
