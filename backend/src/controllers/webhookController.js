import prisma from '../utils/prisma.js';

// POST /api/webhook/telegram
export const handleTelegramWebhook = async (req, res) => {
    try {
        const { message } = req.body;

        // Ensure it's a valid Telegram message structure
        if (message && message.chat && message.text) {
            const firstName = message.chat.first_name || 'Telegram User';
            const lastName = message.chat.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();
            const text = message.text;

            // Find a default user/agent to assign this lead to
            // In a real app, you might map the bot token or standard ID to a specific user
            const defaultUser = await prisma.user.findFirst({
                where: { role: 'AGENT' },
            });

            if (!defaultUser) {
                console.error('No default agent found to assign Telegram lead.');
                return res.status(200).send('OK'); // Return 200 so Telegram doesn't retry
            }

            // Create the Lead record
            const lead = await prisma.lead.create({
                data: {
                    name: fullName,
                    message: text,
                    source: 'Telegram',
                    platformSource: 'Telegram',
                    status: 'NEW',
                    userId: defaultUser.id,
                },
            });

            console.log(`[Webhook] New Telegram lead captured: ${lead.id}`);
        }

        // Always return 200 OK so Telegram knows we received the update
        res.status(200).send('OK');
    } catch (err) {
        console.error('Error handling Telegram webhook:', err);
        // Returning 200 even on error prevents Telegram from retrying the same broken payload repeatedly
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
