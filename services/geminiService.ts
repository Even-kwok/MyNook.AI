import { GoogleGenAI, Modality } from "@google/genai";
import { supabase } from '../lib/supabase';

// Keep GoogleGenAI for text-only operations (AI Advisor)
// These don't consume credits, so they can call Gemini directly
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
if (!apiKey) {
    throw new Error("GEMINI API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey });

/**
 * Generates a text response from the model, with an optional image and system instruction.
 * @param instruction The user's text prompt.
 * @param systemInstruction A system-level instruction to guide the model's behavior.
 * @param base64Image An optional base64 encoded image string (with data: prefix).
 * @returns A promise that resolves to the generated text string.
 */
export const generateTextResponse = async (
    instruction: string,
    systemInstruction: string,
    base64Image: string | null
): Promise<string> => {
    try {
        const textPart = { text: instruction };
        const parts = [];

        if (base64Image) {
            const imagePart = {
                inlineData: {
                    data: base64Image.split(',')[1],
                    mimeType: 'image/png', // The app consistently uses PNG format
                },
            };
            parts.push(imagePart);
        }
        parts.push(textPart);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts }],
            config: {
                systemInstruction: systemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating text response:", error);
        throw new Error("Failed to get a response from the advisor. Please try again.");
    }
};


/**
 * Generates a dynamic prompt for a theme using Gemini.
 * @param themeDescription A description of the theme.
 * @returns A promise that resolves to the generated prompt string.
 */
export const generateDynamicPrompt = async (themeDescription: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a creative and specific interior design style description. The style should be described in a single, detailed sentence. Style theme: ${themeDescription}`,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating dynamic prompt:", error);
        throw new Error("Failed to generate a creative style. Please try again.");
    }
};

/**
 * Generates an image using Supabase Edge Function (secure, credit-based).
 * This replaces the direct Gemini API call for security and credit management.
 * @param instruction The detailed instruction for the image generation.
 * @param base64Images An array of base64 encoded source image strings (without the data: prefix).
 * @returns A promise that resolves to the base64 URL of the generated image.
 */
export const generateImage = async (instruction: string, base64Images: string[]): Promise<string> => {
    try {
        // Get current user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            throw new Error("You must be logged in to generate images.");
        }

        // Call Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('generate-image', {
            body: {
                instruction,
                base64Images,
            },
        });

        if (error) {
            console.error("Edge Function error (detailed):", {
                message: error.message,
                status: error.status,
                statusText: error.statusText,
                context: error.context,
                fullError: error,
            });
            throw new Error(error.message || "Failed to generate image.");
        }
        
        // Log the response for debugging
        console.log("Edge Function response:", data);

        // Handle insufficient credits
        if (data.error === 'Insufficient credits') {
            throw new Error(
                `Insufficient credits. You need ${data.credits_required} credit(s) but only have ${data.credits_available}. Please purchase more credits or upgrade your subscription.`
            );
        }

        if (!data.success || !data.imageUrl) {
            throw new Error(data.error || "Failed to generate image.");
        }

        // Log success for debugging
        console.log(`Image generated successfully. Credits used: ${data.credits_used}, Remaining: ${data.credits_remaining}`);

        return data.imageUrl;
    } catch (error) {
        console.error("Error generating image:", error);
        
        // Re-throw with user-friendly message
        if (error instanceof Error) {
            throw error;
        }
        
        throw new Error("Image generation failed. Please try again.");
    }
};