import type { EngineType, TuningSuggestions } from '../types';

const OLLAMA_API_URL = "http://localhost:11434/api/generate";

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
        const response = await fetch(OLLAMA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama3', // Assumes llama3 model is pulled
                prompt: prompt,
                format: 'json', // Ollama-specific parameter to ensure JSON output
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        let jsonResponseString = data.response;
        
        if (!jsonResponseString) {
             throw new Error("Ollama response did not contain a 'response' field.");
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
            return suggestions;
        } catch (parseError) {
            console.error("Failed to parse cleaned JSON:", jsonResponseString);
            throw new Error("Local AI response was invalid or could not be parsed even after cleaning.");
        }

    } catch (e) {
        console.error("Failed to get tuning suggestions from local AI:", e);
        if (e instanceof Error) {
            if (e.message.toLowerCase().includes('failed to fetch')) {
                throw new Error("Could not connect to the local AI server. Is Ollama running?");
            }
            // re-throw specific errors from the try block
            throw e;
        }
        throw new Error("Local AI response was invalid or could not be parsed.");
    }
};


export const checkLocalAiStatus = async (): Promise<boolean> => {
    try {
        // A simple GET request to the Ollama root is a reliable way to check if it's running.
        const response = await fetch("http://localhost:11434");
        return response.ok;
    } catch (e) {
        // Any failure to fetch (network error, server down) will be caught here.
        return false;
    }
};