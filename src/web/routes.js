const express = require('express');
const router = express.Router();
const Link = require('../db/models/Link');
const Tag = require('../db/models/Tag');

router.get('/links', async (req, res) => {
    try {
        const { search, status } = req.query; // status: 'read', 'unread', 'all'
        let where = {};
        const { Op } = require('sequelize');

        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { summary: { [Op.like]: `%${search}%` } }
            ];
        }

        if (status === 'read') {
            where.is_read = true;
        } else if (status === 'unread') {
            where.is_read = false;
        }

        const links = await Link.findAll({
            where,
            include: Tag,
            order: [['created_at', 'DESC']],
            limit: 50
        });

        res.json(links);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle Read Status
router.patch('/links/:id/toggle-read', async (req, res) => {
    try {
        const link = await Link.findByPk(req.params.id);
        if (!link) return res.status(404).json({ error: 'Link not found' });

        link.is_read = !link.is_read;
        await link.save();

        res.json({ id: link.id, is_read: link.is_read });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/links/:id', async (req, res) => {
    try {
        const link = await Link.findByPk(req.params.id);
        if (!link) return res.status(404).json({ error: 'Link not found' });

        await link.destroy();
        res.json({ success: true, id: req.params.id });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
