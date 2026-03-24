import prisma from '../utils/prisma.js';
import { generateContent } from '../services/ai.service.js';

// POST /api/ai/generate
export const generateAIContent = async (req, res) => {
    try {
        const userId = req.user.id;
        const { prompt, actionType, propertyId } = req.body;

        if (!prompt) return res.status(400).json({ success: false, message: 'Prompt is required' });
        if (!actionType) return res.status(400).json({ success: false, message: 'actionType is required (Caption or Reply)' });

        // AI Usage Limits: 3 generations per hour (for free users)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const count = await prisma.aIRecord.count({
            where: {
                userId,
                createdAt: { gte: oneHourAgo },
            },
        });

        if (count >= 3) {
            return res.status(429).json({
                success: false,
                message: 'Hourly AI limit reached. You can only generate 3 completions per hour on the free plan.'
            });
        }

        // Build a context-aware prompt if a propertyId is provided
        let enrichedPrompt = prompt;
        if (propertyId) {
            const property = await prisma.property.findFirst({
                where: { id: propertyId, userId },
            });
            if (property) {
                enrichedPrompt = `Property: ${property.title} in ${property.location || 'Addis Ababa'}. Price: ${property.price ? `${property.price} ETB` : 'not specified'}. Type: ${property.propertyType || 'Residential'}.\n\nUser request: ${prompt}`;
            }
        }

        // Call real Gemini AI service
        const aiResponse = await generateContent(enrichedPrompt, actionType);

        // Save the record for history
        const aiRecord = await prisma.aIRecord.create({
            data: {
                prompt: enrichedPrompt,
                response: aiResponse,
                actionType,
                userId,
            },
        });

        res.status(201).json({ success: true, data: { response: aiResponse, id: aiRecord.id } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

// GET /api/ai/history
export const getAIHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const records = await prisma.aIRecord.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        res.json({ success: true, data: records });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
