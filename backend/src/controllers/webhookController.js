import prisma from '../utils/prisma.js';

// POST /api/webhook/telegram
export const handleTelegramWebhook = async (req, res) => {
    try {
        const { message } = req.body;

        // Detailed logging of the incoming payload for debugging
        console.log('[Webhook] Received Telegram payload:', JSON.stringify(req.body, null, 2));

        if (message && message.chat && message.text) {
            const firstName = message.from?.first_name || message.chat.first_name || 'Telegram User';
            const lastName = message.from?.last_name || message.chat.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();
            const text = message.text;

            // 1. Smart Phone Number Extraction (Ethiopian format)
            // Matches +251 9... or +251 7... or 09... or 07...
            const ethPhoneRegex = /(\+251[79]\d{8})|(0[79]\d{8})/;
            const phoneMatch = text.match(ethPhoneRegex);
            const extractedPhone = phoneMatch ? phoneMatch[0] : null;

            // 2. Basic Property Interest Detection
            const propertyKeywords = ['apartment', 'villa', 'house', 'studio', 'condo', 'bet', 'ground', 'commercial', 'floor', 'rent', 'sell', 'buy'];
            const lowerText = text.toLowerCase();
            let propertyInterest = null;

            for (const keyword of propertyKeywords) {
                if (lowerText.includes(keyword)) {
                    // Capture a snippet around the keyword if found
                    const words = text.split(/\s+/);
                    const idx = words.findIndex(w => w.toLowerCase().includes(keyword));
                    propertyInterest = words.slice(Math.max(0, idx - 1), idx + 2).join(' ');
                    break;
                }
            }

            // 3. Find a default agent to assign this lead to
            const defaultUser = await prisma.user.findFirst({
                where: { role: 'AGENT' },
                orderBy: { createdAt: 'asc' }
            });

            if (!defaultUser) {
                console.error('[Webhook] CRITICAL: No AGENT found in database to assign Telegram lead.');
                return res.status(200).send('OK');
            }

            // 4. Create Lead record with parsed data
            const lead = await prisma.lead.create({
                data: {
                    name: fullName,
                    phone: extractedPhone,
                    message: text,
                    propertyInterest: propertyInterest || 'General Inquiry',
                    source: 'Telegram',
                    platformSource: 'Telegram',
                    status: 'NEW',
                    userId: defaultUser.id,
                },
            });

            console.log(`[Webhook] SUCCESS: Captured Telegram Lead | ID: ${lead.id} | Name: ${fullName} | Phone: ${extractedPhone || 'None'}`);
        }

        res.status(200).send('OK');
    } catch (err) {
        console.error('[Webhook] ERROR handling Telegram webhook:', err);
        res.status(200).send('OK');
    }
};

// POST /api/webhook/tiktok
export const handleTikTokWebhook = async (req, res) => {
    try {
        // Placeholder for future TikTok Business API / Lead Generation webhook
        // We will parse TikTok's payload here once configured
        console.log('[Webhook] TikTok endpoint hit:', req.body);

        res.status(200).send('OK');
    } catch (err) {
        console.error('Error handling TikTok webhook:', err);
        res.status(200).send('OK');
    }
};

// GET /api/tiktok/poll
export const pollTikTokLeads = async (req, res) => {
    try {
        // Placeholder manual polling endpoint that could fetch from TikTok APIs
        res.json({ success: true, message: 'TikTok polling successful. No new leads found (placeholder).' });
    } catch (err) {
        console.error('Error polling TikTok leads:', err);
        res.status(500).json({ success: false, message: 'Server error during polling' });
    }
};
