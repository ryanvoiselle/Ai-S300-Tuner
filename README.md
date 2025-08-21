# Hondata AI Tuning Assistant (Desktop Application)

This is a desktop application that uses AI to analyze Hondata S300 datalogs and provide expert tuning advice. It runs as a standalone Electron application on your computer.

## Features

- **Cloud AI Analysis:** Uses Google Gemini API for powerful AI-driven datalog analysis
- **Datalog Analysis:** Upload `.csv` datalogs from Hondata SManager
- **Base Map Integration:** Upload your `.skl` base map for more specific tuning advice
- **AI-Powered Suggestions:** Get detailed feedback on fuel, ignition, and other engine parameters
- **Test Environment:** Generate simulated datalogs to test the AI's capabilities on common tuning issues
- **Export Functions:** Download detailed tuning reports and recommendations

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or higher)
- A Google Gemini API key (free from Google AI Studio)

### Setup & Run

1. **Clone or download this repository**
   ```bash
   git clone <your-repo-url>
   cd hondata-ai-tuning-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

That's it! The app will build itself and launch automatically.

## Packaging for Distribution

To create a standalone `.exe` file for Windows, run the following command:

```bash
npm run package
```

This will first build the frontend assets and then package the application. The output, including a portable `.exe` file, will be located in the `release/` directory.

## Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in the app's AI Settings section

## Usage

1. **Configure your engine setup** - Select naturally aspirated or boosted, and describe your setup
2. **Upload a datalog** - Use a CSV export from Hondata SManager, or generate test data
3. **Set up AI provider** - Configure your Gemini API key in the AI Settings
4. **Analyze** - Click "Analyze Datalog" to get AI-powered tuning suggestions
5. **Export results** - Download detailed recommendations as a text file

## Troubleshooting

### App won't start
- Make sure you've run `npm install` first
- Check that Node.js is installed: `node --version`
- Try: `npm run clean && npm run build && npm start`

### Missing files error
- Run `npm run build` to compile the frontend assets
- Make sure all dependencies installed correctly

### AI analysis fails
- Verify your Gemini API key is configured correctly
- Check your internet connection for cloud AI
- Look at the application logs in your user data folder

## Development

### Available Scripts

- `npm start` - Build and run the app
- `npm run build` - Build frontend assets only
- `npm run package` - Package the application for distribution
- `npm run dev` - Run in development mode
- `npm run clean` - Clean build and release files

### Project Structure

```
├── electron.js          # Main Electron process
├── preload.js           # Preload script for security
├── App.tsx              # Main React component
├── components/          # UI components
├── services/            # Business logic
├── types.ts             # TypeScript definitions
└── dist/                # Built assets (auto-generated)
└── release/             # Packaged app (auto-generated)
```

## Important Notes

- **Engine tuning is inherently risky** - Always have your vehicle tuned by a qualified professional
- This tool provides suggestions only - review all recommendations carefully
- Always tune on a dynamometer with proper safety equipment
- The creators are not responsible for any damage resulting from using this software

## Contributing

Feel free to submit issues, feature requests, or pull requests. This is a community project aimed at helping tuners make better decisions with AI assistance.

## License

MIT License - see LICENSE file for details