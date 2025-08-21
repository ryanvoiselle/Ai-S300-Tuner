import type { EngineType, TuningSuggestions } from '../types';

// A simplified schema definition for the prompt, making it clear to the local model.
const jsonSchemaString = `{
    "summary": "string",
    "fuelAdjustments": [{ "rpmRange": "string", "loadCondition": "string", "currentAFR": "string", "targetAFR": "string", "suggestion": "string", "reason": "string" }],
    "ignitionAdjustments": [{ "rpmRange": "string", "loadCondition": "string", "suggestion": "string", "reason": "string" }],
    "otherObservations": [{ "observation": "string", "recommendation": "string" }]
}`;


const buildPrompt = (datalog: string, engineType: EngineType, engineSetup: string, turboSetup: string): string => {
    const isBoosted = engineType === 'boosted';
    const engineTypeText = isBoosted ? "Boosted (Forced Induction)" : "Naturally Aspirated";
    const targetAfrWot = isBoosted ? "11.0-11.5" : "12.8-13.2";

    const hardwareContext = `
        User Hardware Information:
        - Engine Details: ${engineSetup || "Not specified."}
        - Turbo/Induction Setup: ${turboSetup || (isBoosted ? "Boosted setup not specified." : "Naturally Aspirated.")}
    `;

    // System prompt is now implicitly handled by the model choice and this detailed instruction set.
    return `
        You are an expert engine tuner for Hondata systems. Your task is to analyze the provided CSV datalog based on the user's hardware.
        Provide actionable tuning advice for the Hondata SManager software.
        Your entire response must be a single, valid JSON object, without any markdown formatting, comments, or extra text.
        The JSON object must conform to this structure: ${jsonSchemaString}

        Tuning Goals:
        - Safety first, then performance.
        - Idle/Cruise AFR: ~14.7
        - WOT AFR for ${engineTypeText}: ${targetAfrWot}
        - Identify risky ignition timing.
        - Check for high injector duty cycle (>85%).
        - Correlate issues with the user's provided hardware.

        ${hardwareContext}

        Analyze this datalog:
        \`\`\`csv
        ${datalog}
        \`\`\`
    `;
}

export const getTuningSuggestions = async (datalog: string, engineType: EngineType, engineSetup: string, turboSetup: string): Promise<TuningSuggestions> => {
    const prompt = buildPrompt(datalog, engineType, engineSetup, turboSetup);

    try {
        let jsonResponseString = await window.electronAPI.runInference(prompt);
        
        if (!jsonResponseString) {
             throw new Error("Local AI response was empty.");
        }

        // Clean the response: find the first '{' and the last '}' to handle markdown/chattiness.
        const firstBracket = jsonResponseString.indexOf('{');
        const lastBracket = jsonResponseString.lastIndexOf('}');
        
        if (firstBracket === -1 || lastBracket === -1) {
            console.error("Malformed AI Response:", jsonResponseString);
            throw new Error("Could not find a valid JSON object in the AI response.");
        }

        jsonResponseString = jsonResponseString.substring(firstBracket, lastBracket + 1);

        try {
            const suggestions: TuningSuggestions = JSON.parse(jsonResponseString);
            // Check for an error object returned from the main process
            if ((suggestions as any).error) {
                 throw new Error((suggestions as any).error);
            }
            return suggestions;
        } catch (parseError) {
            console.error("Failed to parse cleaned JSON:", jsonResponseString);
            throw new Error("Local AI response was invalid or could not be parsed even after cleaning.");
        }

    } catch (e) {
        console.error("Failed to get tuning suggestions from local AI:", e);
        if (e instanceof Error) {
            throw e; // Re-throw the specific error
        }
        throw new Error("An unknown error occurred during AI analysis.");
    }
};
