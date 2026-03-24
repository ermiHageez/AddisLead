import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const SYSTEM_PROMPT = `
You are AddisLead AI, a specialized real estate assistant for agents in Addis Ababa, Ethiopia.
Your goal is to help agents create viral social media content (TikTok/Telegram) and professional client replies.

Context & Rules:
1. Location: Focus on Addis Ababa neighborhoods (Bole, Sarbet, Ayat, CMC, Old Airport, Kazanchis, etc.).
2. Language: You can respond in English or Amharic (using Ethiopic script). If the user asks in Amharic, reply in Amharic.
3. Content Type: 
   - 'Caption': Create catchy, emoji-rich captions for property listings. Include local selling points (e.g., "Near shopping malls", "Graceful view", "Secure neighborhood").
   - 'Reply': Professional, welcoming responses to potential leads interested in a property.
4. Tone: Energetic, professional, and trustworthy.
5. Ethiopian Context: Understand ETB pricing and local property features.

Keep responses concise and ready to copy-paste.
`;

/**
 * Generate AI content using Google Gemini
 * @param {string} prompt - The user's request
 * @param {string} actionType - Caption or Reply
 * @returns {Promise<string>} - The generated content
 */
export const generateContent = async (prompt, actionType) => {
    try {
        if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY.includes('your_gemini')) {
            throw new Error("Invalid or missing GOOGLE_API_KEY in .env");
        }

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const fullPrompt = `${SYSTEM_PROMPT}\n\nTask: Generate a ${actionType}\nUser Prompt: ${prompt}`;

        // List of models to try in order of preference (matched to your API's specific available list)
        const modelsToTry = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-pro-latest", "gemini-2.0-flash"];
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(fullPrompt);
                const response = await result.response;
                return response.text();
            } catch (err) {
                lastError = err;
                const isQuotaError = err.message?.includes('429') || err.message?.includes('quota');
                const isNotFoundError = err.message?.includes('404') || err.message?.includes('not found');

                if (isQuotaError || isNotFoundError) {
                    console.warn(`Model ${modelName} failed (${isQuotaError ? 'Quota' : 'Not Found'}). Trying next...`);
                    continue; // Try the next model
                }
                throw err; // For other errors (like invalid prompt), stop and throw
            }
        }

        throw lastError || new Error("All AI models failed to generate content.");

    } catch (error) {
        console.error("Gemini AI Error Detail:", error);

        if (error.message?.includes('429')) {
            throw new Error("AI Quota exceeded. Please try again in a few minutes or check your Google AI Studio billing.");
        }

        throw new Error(error.message || "Failed to generate AI content. Please check your API key.");
    }
};