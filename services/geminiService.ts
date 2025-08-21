import { GoogleGenAI, Type } from "@google/genai";
import type { EngineType, TuningSuggestions } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const tuningResponseSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "A brief, one-paragraph overview of the datalog, highlighting key findings based on the user's specific hardware.",
        },
        fuelAdjustments: {
            type: Type.ARRAY,
            description: "A list of suggestions for adjusting the fuel map.",
            items: {
                type: Type.OBJECT,
                properties: {
                    rpmRange: { type: Type.STRING, description: "e.g., 3000-4000 RPM" },
                    loadCondition: { type: Type.STRING, description: "e.g., WOT / >10 psi boost / Light Cruise" },
                    currentAFR: { type: Type.STRING, description: "The average Air-Fuel Ratio observed in this range." },
                    targetAFR: { type: Type.STRING, description: "The recommended target Air-Fuel Ratio for this range." },
                    suggestion: { type: Type.STRING, description: "e.g., Increase fuel by 5% in the high-speed fuel table cells corresponding to this range." },
                    reason: { type: Type.STRING, description: "e.g., Current AFR is too lean under boost, risking engine damage." },
                },
                required: ["rpmRange", "loadCondition", "currentAFR", "targetAFR", "suggestion", "reason"]
            }
        },
        ignitionAdjustments: {
            type: Type.ARRAY,
            description: "A list of suggestions for adjusting the ignition timing map.",
            items: {
                type: Type.OBJECT,
                properties: {
                    rpmRange: { type: Type.STRING, description: "e.g., 5000-6000 RPM" },
                    loadCondition: { type: Type.STRING, description: "e.g., WOT / Peak Torque" },
                    suggestion: { type: Type.STRING, description: "e.g., Retard timing by 1 degree in the high-speed ignition table." },
                    reason: { type: Type.STRING, description: "e.g., To create a larger safety margin against knock with this turbo setup." },
                },
                required: ["rpmRange", "loadCondition", "suggestion", "reason"]
            }
        },
        otherObservations: {
            type: Type.ARRAY,
            description: "A list of any other notable observations from the datalog.",
            items: {
                type: Type.OBJECT,
                properties: {
                    observation: { type: Type.STRING, description: "e.g., Injector duty cycle is approaching 90%." },
                    recommendation: { type: Type.STRING, description: "e.g., The specified 550cc injectors may be insufficient for the target power level." },
                },
                required: ["observation", "recommendation"]
            }
        }
    },
    required: ["summary", "fuelAdjustments", "ignitionAdjustments", "otherObservations"]
};


const buildPrompt = (datalog: string, engineType: EngineType, engineSetup: string, turboSetup: string): string => {
    const isBoosted = engineType === 'boosted';
    const engineTypeText = isBoosted ? "Boosted (Forced Induction)" : "Naturally Aspirated";
    const targetAfrWot = isBoosted ? "11.0-11.5" : "12.8-13.2";

    const hardwareContext = `
        The user has provided the following hardware information. Tailor your advice specifically for this setup.
        - Engine Details: ${engineSetup || "Not specified."}
        - Turbo/Induction Setup: ${turboSetup || (isBoosted ? "Boosted setup not specified." : "Naturally Aspirated.")}
    `;

    return `
        You are an expert engine tuner specializing in Honda B-series, D-series, and K-series engines using the Hondata S300 platform.
        Analyze the provided datalog (in CSV format) in the context of the user's specific vehicle setup.
        Assume the user is starting with a base calibration file (.skl) and needs to know which tables and cells to modify in the Hondata SManager software.

        ${hardwareContext}

        Your primary goals are to ensure engine safety and then optimize for performance.

        Key Tuning Targets:
        1.  Air-Fuel Ratio (AFR):
            -   Idle/Light Cruise: Target ~14.7 AFR.
            -   WOT (${engineTypeText}): Target ${targetAfrWot} AFR.
        2.  Ignition Timing:
            -   Identify areas that may be too aggressive (risking knock) or too conservative for the user's setup.
            -   Suggest specific, conservative changes to timing tables (e.g., "Retard timing by 1-2 degrees in the high cam ignition map from 5000-7000 RPM under boost").
        3.  Other Parameters:
            -   Check injector duty cycle (over 85% is a concern).
            -   Check for VTEC engagement issues.
            -   Correlate findings with the user's hardware. For example, if injector duty is high, mention that their specified injectors might be too small.

        Task:
        Analyze the datalog below. Provide specific, actionable suggestions for adjusting fuel and ignition maps in SManager.
        Reference specific tables (e.g., low-speed/high-speed fuel/ignition). Your response MUST be in the specified JSON format.

        Datalog Content:
        \`\`\`csv
        ${datalog}
        \`\`\`
    `;
}

export const getTuningSuggestions = async (datalog: string, engineType: EngineType, engineSetup: string, turboSetup: string): Promise<TuningSuggestions> => {
    
    const prompt = buildPrompt(datalog, engineType, engineSetup, turboSetup);

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: tuningResponseSchema,
        },
    });

    const jsonText = response.text.trim();
    
    try {
        const suggestions: TuningSuggestions = JSON.parse(jsonText);
        return suggestions;
    } catch (e) {
        console.error("Failed to parse Gemini response as JSON:", jsonText);
        throw new Error("AI response was not in the expected format.");
    }
};