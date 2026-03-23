import prisma from '../utils/prisma.js';

// GET /api/leads
export const getLeads = async (req, res) => {
    try {
        const { status, source, search } = req.query;
        const userId = req.user.id;

        const where = {
            userId,
            ...(status && { status }),
            ...(source && { platformSource: source }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        const leads = await prisma.lead.findMany({
            where,
            include: { property: { select: { id: true, title: true, location: true } } },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: leads });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /api/leads
export const createLead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, phone, platformSource, status, budget, notes, propertyId } = req.body;

        if (!name) return res.status(400).json({ success: false, message: 'Lead name is required' });

        const lead = await prisma.lead.create({
            data: {
                name,
                phone,
                platformSource,
                status: status || 'NEW',
                budget: budget ? parseFloat(budget) : null,
                notes,
                userId,
                propertyId: propertyId || null,
            },
        });

        res.status(201).json({ success: true, data: lead });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/leads/:id
export const getLeadById = async (req, res) => {
    try {
        const lead = await prisma.lead.findFirst({
            where: { id: req.params.id, userId: req.user.id },
            include: { property: true },
        });

        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
        res.json({ success: true, data: lead });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PATCH /api/leads/:id
export const updateLead = async (req, res) => {
    try {
        const { name, phone, platformSource, status, budget, notes, propertyId } = req.body;

        const lead = await prisma.lead.updateMany({
            where: { id: req.params.id, userId: req.user.id },
            data: {
                ...(name && { name }),
                ...(phone && { phone }),
                ...(platformSource && { platformSource }),
                ...(status && { status }),
                ...(budget !== undefined && { budget: budget ? parseFloat(budget) : null }),
                ...(notes !== undefined && { notes }),
                ...(propertyId !== undefined && { propertyId }),
            },
        });

        if (lead.count === 0)
            return res.status(404).json({ success: false, message: 'Lead not found or unauthorized' });

        const updated = await prisma.lead.findUnique({ where: { id: req.params.id } });
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// DELETE /api/leads/:id
export const deleteLead = async (req, res) => {
    try {
        const deleted = await prisma.lead.deleteMany({
            where: { id: req.params.id, userId: req.user.id },
        });

        if (deleted.count === 0)
            return res.status(404).json({ success: false, message: 'Lead not found or unauthorized' });

        res.json({ success: true, message: 'Lead deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
