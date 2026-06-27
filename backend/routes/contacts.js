// routes/contacts.js
const router = require('express').Router();
const prisma = require('../lib/prisma');

// GET /api/contacts
router.get('/', async (req, res) => {
  try {
    const { search, group } = req.query;
    const contacts = await prisma.contact.findMany({
      where: {
        userId: req.user.id,
        active: true,
        ...(group ? { group } : {}),
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ],
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contacts/groups
router.get('/groups', async (req, res) => {
  try {
    const groups = await prisma.contact.groupBy({
      by: ['group'],
      where: { userId: req.user.id, active: true },
      _count: { id: true },
      orderBy: { group: 'asc' },
    });
    res.json(groups.map((g) => ({ name: g.group, count: g._count.id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contacts
router.post('/', async (req, res) => {
  try {
    const { name, phone, group, notes } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });

    const contact = await prisma.contact.create({
      data: {
        name: name || phone,
        phone: phone.replace(/\D/g, ''),
        group: group || 'General',
        notes,
        userId: req.user.id,
      },
    });
    res.status(201).json(contact);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'This phone number already exists' });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contacts/bulk
router.post('/bulk', async (req, res) => {
  try {
    const { contacts } = req.body;
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: 'Expected a non-empty array' });
    }

    const data = contacts.map((c) => ({
      name: c.name || c.phone,
      phone: String(c.phone).replace(/\D/g, ''),
      group: c.group || 'General',
      notes: c.notes || null,
      userId: req.user.id,
    }));

    // Upsert – skip duplicates by phone+userId
    const result = await prisma.contact.createMany({
      data,
      skipDuplicates: true,
    });

    res.status(201).json({ added: result.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/contacts/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, group, notes } = req.body;
    const contact = await prisma.contact.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone: phone.replace(/\D/g, '') }),
        ...(group !== undefined && { group }),
        ...(notes !== undefined && { notes }),
      },
    });
    if (contact.count === 0) return res.status(404).json({ error: 'Contact not found' });
    const updated = await prisma.contact.findUnique({ where: { id: req.params.id } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/contacts/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.contact.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { active: false }, // soft delete
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
