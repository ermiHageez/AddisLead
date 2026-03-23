import prisma from '../utils/prisma.js';

// POST /api/ai/generate
export const generateAIContent = async (req, res) => {
    try {
        const userId = req.user.id;
        const { prompt, actionType, propertyId } = req.body;

        if (!prompt) return res.status(400).json({ success: false, message: 'Prompt is required' });
        if (!actionType) return res.status(400).json({ success: false, message: 'actionType is required (Caption or Reply)' });

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

        // TODO: Replace this mock response with your actual AI provider (OpenAI, Gemini, etc.)
        // Example: const completion = await openai.chat.completions.create({ ... })
        const mockResponse = generateMockResponse(actionType, enrichedPrompt);

        // Save the record for history
        const aiRecord = await prisma.aIRecord.create({
            data: {
                prompt: enrichedPrompt,
                response: mockResponse,
                actionType,
                userId,
            },
        });

        res.status(201).json({ success: true, data: { response: mockResponse, id: aiRecord.id } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
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

function generateMockResponse(actionType, prompt) {
    if (actionType === 'Caption') {
        return `✨ Stunning property alert in Addis Ababa! 🏠\n\n${prompt.substring(0, 80)}...\n\nContact us today for a viewing!\n\n#AddisAbabaRealEstate #EthiopiaHomes #PropertyForSale #AddisLead #RealEstateEthiopia #TikTokRealEstate`;
    }
    if (actionType === 'Reply') {
        return `Hello! Thank you for your interest. We would love to arrange a viewing for you. Please share your available times and we will confirm a slot as soon as possible. Feel free to reach out via WhatsApp or Telegram for a quicker response! 🏠`;
    }
    return `AI response for: ${prompt}`;
}
