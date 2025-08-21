import type { EngineType, TuningSuggestions } from '../types';

const buildPrompts = (datalog: string, engineType: EngineType, engineSetup: string, turboSetup: string): { systemPrompt: string, userPrompt: string } => {
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

export const getTuningSuggestions = async (
    datalog: string,
    engineType: EngineType,
    engineSetup: string,
    turboSetup: string
): Promise<TuningSuggestions> => {

    try {
        const result = await window.electronAPI.runAiAnalysis({
            datalog,
            engineType,
            engineSetup,
            turboSetup,
        });
        
        if (result.success && result.suggestions) {
            return result.suggestions;
        }
        
        throw new Error(result.error || "AI analysis failed or returned no suggestions.");

    } catch (e) {
        console.error(`Failed to get tuning suggestions from AI:`, e);
        if (e instanceof Error) {
            throw e;
        }
        throw new Error("An unknown error occurred during AI analysis.");
    }
};
