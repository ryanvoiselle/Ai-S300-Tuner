import type { EngineType, TuningSuggestions, AIProvider } from '../types';

// --- Prompt for Local Llama Model ---
const buildLocalPrompt = (datalog: string, engineType: EngineType, engineSetup: string, turboSetup: string): string => {
    const jsonSchemaString = `{
        "summary": "string",
        "fuelAdjustments": [{ "rpmRange": "string", "loadCondition": "string", "currentAFR": "string", "targetAFR": "string", "suggestion": "string", "reason": "string" }],
        "ignitionAdjustments": [{ "rpmRange": "string", "loadCondition": "string", "suggestion": "string", "reason": "string" }],
        "otherObservations": [{ "observation": "string", "recommendation": "string" }]
    }`;
    const isBoosted = engineType === 'boosted';
    const engineTypeText = isBoosted ? "Boosted (Forced Induction)" : "Naturally Aspirated";
    const targetAfrWot = isBoosted ? "11.0-11.5" : "12.8-13.2";

    const systemPrompt = `You are an expert engine tuner for Hondata systems. Your task is to analyze the provided CSV datalog and user hardware information.
Provide actionable tuning advice for the Hondata SManager software.
Your entire response must be a single, valid JSON object, without any markdown formatting, comments, or extra text.
The JSON object must conform to this structure: ${jsonSchemaString}

Tuning Goals:
- Safety first, then performance.
- Idle/Cruise AFR: ~14.7
- WOT AFR for ${engineTypeText}: ${targetAfrWot}
- Identify risky ignition timing.
- Check for high injector duty cycle (>85%).
- Correlate issues with the user's provided hardware.`;

    const userPrompt = `
        User Hardware Information:
        - Engine Details: ${engineSetup || "Not specified."}
        - Turbo/Induction Setup: ${turboSetup || (isBoosted ? "Boosted setup not specified." : "Naturally Aspirated.")}

        Analyze this datalog:
        \`\`\`csv
        ${datalog}
        \`\`\`
    `;

    // Llama 3 Instruct prompt format
    return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n${userPrompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`;
};


// --- Prompt for Google Gemini ---
const buildGeminiPrompts = (datalog: string, engineType: EngineType, engineSetup: string, turboSetup: string): { systemPrompt: string, userPrompt: string } => {
    const isBoosted = engineType === 'boosted';
    const engineTypeText = isBoosted ? "Boosted (Forced Induction)" : "Naturally Aspirated";
    const targetAfrWot = isBoosted ? "11.0-11.5" : "12.8-13.2";

    const systemPrompt = `You are an expert engine tuner specializing in Hondata S300 systems. Your task is to analyze the provided CSV datalog and user hardware information, then provide actionable tuning advice.
Your entire response must be a JSON object that conforms to the schema provided.

Key Tuning Objectives:
- Prioritize engine safety above all else.
- Target an idle and light cruise Air-Fuel Ratio (AFR) of approximately 14.7.
- For a ${engineTypeText} engine, target a Wide Open Throttle (WOT) AFR between ${targetAfrWot}.
- Analyze ignition timing for signs of being too aggressive (risk of knock) or too conservative (loss of power).
- Monitor injector duty cycle and flag if it exceeds a safe threshold of 85%.
- Consider the user's hardware setup in all recommendations. For example, larger injectors might explain low duty cycles, or a large turbo might explain boost lag.`;

    const userPrompt = `
        Please analyze the following datalog based on my hardware setup.

        ## User Hardware Information:
        - **Engine Type**: ${engineTypeText}
        - **Engine Details**: ${engineSetup || "Not specified."}
        - **Turbo/Induction Setup**: ${turboSetup || (isBoosted ? "Boosted setup details not provided." : "Naturally Aspirated.")}

        ## Datalog (CSV Content):
        \`\`\`csv
        ${datalog}
        \`\`\`
    `;

    return { systemPrompt, userPrompt };
};


/**
 * Extracts a JSON object from a string, handling markdown code blocks and other text.
 * @param str The string potentially containing a JSON object.
 * @returns The cleaned JSON string.
 */
const extractJsonFromString = (str: string): string => {
    const jsonBlockMatch = str.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
        return jsonBlockMatch[1];
    }
    const firstBracket = str.indexOf('{');
    const lastBracket = str.lastIndexOf('}');
    if (firstBracket !== -1 && lastBracket > firstBracket) {
        return str.substring(firstBracket, lastBracket + 1);
    }
    return str; // Return as-is if no clear JSON is found
};


export const getTuningSuggestions = async (
    provider: AIProvider,
    datalog: string,
    engineType: EngineType,
    engineSetup: string,
    turboSetup: string
): Promise<TuningSuggestions> => {

    let rawResponse: string;

    try {
        if (provider === 'local') {
            const prompt = buildLocalPrompt(datalog, engineType, engineSetup, turboSetup);
            rawResponse = await window.electronAPI.runInference({ provider, prompt });
        } else { // gemini
            const { systemPrompt, userPrompt } = buildGeminiPrompts(datalog, engineType, engineSetup, turboSetup);
            rawResponse = await window.electronAPI.runInference({ provider, systemPrompt, userPrompt });
        }
        
        if (!rawResponse) {
             throw new Error("AI response was empty.");
        }

        // Gemini with JSON schema mode should return clean JSON, but local might not.
        const jsonResponseString = provider === 'local' ? extractJsonFromString(rawResponse) : rawResponse;

        try {
            const suggestions: TuningSuggestions = JSON.parse(jsonResponseString);
            if ((suggestions as any).error) {
                 throw new Error((suggestions as any).error);
            }
            return suggestions;
        } catch (parseError) {
            console.error("Original AI Response:", rawResponse);
            console.error("Failed to parse cleaned JSON:", jsonResponseString);
            throw new Error("AI response was invalid or could not be parsed.");
        }

    } catch (e) {
        console.error(`Failed to get tuning suggestions from ${provider} AI:`, e);
        if (e instanceof Error) {
            throw e; // Re-throw the specific error
        }
        throw new Error("An unknown error occurred during AI analysis.");
    }
};