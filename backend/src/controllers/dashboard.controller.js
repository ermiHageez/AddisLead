import prisma from '../utils/prisma.js';

// GET /api/dashboard/stats
export const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const [totalLeads, newLeads, followUpLeads, visitingLeads, closedLeads, totalProperties] =
            await Promise.all([
                prisma.lead.count({ where: { userId } }),
                prisma.lead.count({ where: { userId, status: 'NEW' } }),
                prisma.lead.count({ where: { userId, status: 'FOLLOW_UP' } }),
                prisma.lead.count({ where: { userId, status: 'VISITING' } }),
                prisma.lead.count({ where: { userId, status: 'CLOSED' } }),
                prisma.property.count({ where: { userId } }),
            ]);

        // Calculate pipeline value (sum of budget for non-closed leads)
        const pipelineValue = await prisma.lead.aggregate({
            where: { userId, status: { not: 'CLOSED' }, budget: { not: null } },
            _sum: { budget: true },
        });

        // Total sales value (closed leads with budget)
        const salesValue = await prisma.lead.aggregate({
            where: { userId, status: 'CLOSED', budget: { not: null } },
            _sum: { budget: true },
        });

        // Recent 5 leads for dashboard feed
        const recentLeads = await prisma.lead.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { property: { select: { title: true, location: true } } },
        });

        // Source breakdown
        const leads = await prisma.lead.findMany({
            where: { userId },
            select: { platformSource: true },
        });
        const sourceMap = {};
        leads.forEach((l) => {
            const src = l.platformSource || 'Direct';
            sourceMap[src] = (sourceMap[src] || 0) + 1;
        });

        res.json({
            success: true,
            data: {
                totalLeads,
                newLeads,
                followUpLeads,
                visitingLeads,
                closedLeads,
                totalProperties,
                pipelineValue: pipelineValue._sum.budget || 0,
                salesValue: salesValue._sum.budget || 0,
                recentLeads,
                sourceBreakdown: sourceMap,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/dashboard/insights
export const getInsights = async (req, res) => {
    try {
        const userId = req.user.id;

        // Leads created in the last 30 days grouped by day
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentLeads = await prisma.lead.findMany({
            where: { userId, createdAt: { gte: thirtyDaysAgo } },
            select: { createdAt: true, status: true, budget: true, platformSource: true },
        });

        // Conversion rate
        const totalCount = await prisma.lead.count({ where: { userId } });
        const closedCount = await prisma.lead.count({ where: { userId, status: 'CLOSED' } });
        const conversionRate = totalCount > 0 ? Math.round((closedCount / totalCount) * 100) : 0;

        res.json({
            success: true,
            data: {
                conversionRate,
                totalLeads: totalCount,
                closedDeals: closedCount,
                recentActivity: recentLeads,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/dashboard/leads
export const getDashboardLeads = async (req, res) => {
    try {
        const userId = req.user.id;
        const leads = await prisma.lead.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { property: { select: { title: true } } },
        });

        res.json({ success: true, data: leads });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

