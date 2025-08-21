# Quick Setup Instructions

Follow these steps to get your Hondata AI Tuning Assistant working:

## 1. Replace Your Files

Replace the following files in your project with the fixed versions I've provided:

### Core Files (Required)
- `package.json` - Updated dependencies and scripts
- `electron.js` - Fixed main process without complex dependencies
- `preload.js` - Simplified preload script
- `App.tsx` - Updated main app component
- `types.ts` - Updated TypeScript definitions
- `index.html` - Fixed HTML template
- `README.md` - Updated documentation

### Components (Replace existing in `/components/` folder)
- `components/AISettings.tsx` - **NEW FILE** - AI configuration component
- `components/ResultsDisplay.tsx` - Updated results display
- `components/TuneExporter.tsx` - Updated export functionality

### Keep These Files (No changes needed)
- `components/Header.tsx`
- `components/LoadingSpinner.tsx`
- `components/Configuration.tsx`
- `components/Disclaimer.tsx`
- `components/FileUpload.tsx`
- `components/OptionsSelector.tsx`
- `components/Simulator.tsx`
- `services/simulationService.ts`
- `styles/tailwind.css`
- `tailwind.config.js`
- `tsconfig.json`
- `index.tsx`

## 2. Install Dependencies

```bash
npm install
```

## 3. Build and Run

```bash
npm start
```

That's it! The app should now launch successfully.

## 4. Configure AI Provider

1. When the app opens, go to the "AI Provider Settings" section
2. Make sure "Cloud AI" is selected
3. Click "Configure API Key"
4. Get a free API key from: https://makersuite.google.com/app/apikey
5. Paste the key and click "Save Key"

## What Was Fixed

✅ **Removed complex dependencies** that were causing startup issues
✅ **Simplified AI integration** with working cloud provider
✅ **Fixed build process** to ensure all files are generated
✅ **Updated error handling** for better user experience
✅ **Streamlined file structure** for easier maintenance
✅ **Added proper TypeScript types** for better development

## Testing the App

1. **Generate test data** using the simulator (try "Lean WOT Pull")
2. **Configure your Gemini API key** in AI Settings
3. **Click "Analyze Datalog"** to test the AI analysis
4. **Export results** to verify the export functionality works

The app now has a much more reliable foundation and should start consistently!

## Troubleshooting

If you still have issues:

1. **Delete node_modules and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Clean build and restart:**
   ```bash
   npm run clean
   npm run build
   npm start
   ```

3. **Check the console output** for any error messages

4. **Verify all files were replaced** with the new versions