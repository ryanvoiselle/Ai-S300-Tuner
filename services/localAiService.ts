import type { EngineType, TuningSuggestions, AIProvider } from '../types';

const buildPrompts = (datalog: string, engineType: EngineType, engineSetup: string, turboSetup: string): { systemPrompt: string, userPrompt: string, prompt: string } => {
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
    
    // For local model, we combine prompts
    const combinedPrompt = `${systemPrompt}\n\n## Instructions\nAnalyze the following user request and datalog. Provide your response as a valid JSON object matching the required schema.\n\n## User Request\n${userPrompt}`;

    return { systemPrompt, userPrompt: userPrompt, prompt: combinedPrompt };
};

export const getTuningSuggestions = async (
    datalog: string,
    engineType: EngineType,
    engineSetup: string,
    turboSetup: string,
    provider: AIProvider
): Promise<TuningSuggestions> => {

    const prompts = buildPrompts(datalog, engineType, engineSetup, turboSetup);

    try {
        const rawResponse = await window.electronAPI.runInference({
            provider,
            ...prompts
        });
        
        if (!rawResponse) {
             throw new Error("AI response was empty.");
        }
        
        try {
            // The backend should return a clean JSON string.
            const suggestions: TuningSuggestions = JSON.parse(rawResponse);
            // Check for an error message returned within the JSON
            if ((suggestions as any).error) {
                 throw new Error((suggestions as any).error);
            }
            return suggestions;
        } catch (parseError) {
            console.error("Original AI Response:", rawResponse);
            throw new Error("AI response was invalid or could not be parsed. Check the application logs for more details.");
        }

    } catch (e) {
        console.error(`Failed to get tuning suggestions from AI provider (${provider}):`, e);
        if (e instanceof Error) {
            throw e;
        }
        throw new Error("An unknown error occurred during AI analysis.");
    }
};