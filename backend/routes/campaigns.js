// routes/campaigns.js
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { sendToNumber } = require('../lib/whatsapp');

let io; // injected from server.js
function setIo(socketIo) { io = socketIo; }

// GET /api/campaigns
router.get('/', async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { userId: req.user.id },
      include: {
        mediaFile: { select: { url: true, originalName: true, mimetype: true } },
        _count: { select: { results: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/campaigns/:id  (with full results)
router.get('/:id', async (req, res) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        mediaFile: true,
        results: {
          include: { contact: { select: { name: true, phone: true } } },
          orderBy: { sentAt: 'desc' },
        },
      },
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/campaigns  – create and run
router.post('/', async (req, res) => {
  const { name, message, mediaFileId, caption, recipientIds, groups, delayMs = 3000, waStatus } = req.body;

  if (!message && !mediaFileId) return res.status(400).json({ error: 'Provide a message or media file' });
  if (waStatus !== 'ready') return res.status(503).json({ error: 'WhatsApp not connected. Scan QR first.' });

  // Resolve recipients
  let where = { userId: req.user.id, active: true };
  if (recipientIds?.length > 0) where.id = { in: recipientIds };
  else if (groups?.length > 0) where.group = { in: groups };

  const recipients = await prisma.contact.findMany({ where });
  if (recipients.length === 0) return res.status(400).json({ error: 'No recipients found' });

  // Get media file details
  let mediaFile = null;
  if (mediaFileId) {
    mediaFile = await prisma.mediaFile.findFirst({ where: { id: mediaFileId, userId: req.user.id } });
    if (!mediaFile) return res.status(404).json({ error: 'Media file not found' });
  }

  // Create campaign record
  const campaign = await prisma.campaign.create({
    data: {
      name: name || `Campaign ${new Date().toLocaleString()}`,
      message,
      caption,
      delayMs,
      status: 'RUNNING',
      totalRecipients: recipients.length,
      userId: req.user.id,
      ...(mediaFileId ? { mediaFileId } : {}),
    },
  });

  // Respond immediately, run sends in background
  res.status(201).json({ campaignId: campaign.id, totalRecipients: recipients.length });

  // ── Background send loop ────────────────────────────────
  (async () => {
    let sent = 0, failed = 0;

    for (let i = 0; i < recipients.length; i++) {
      const contact = recipients[i];
      let status = 'sent', error = null;

      try {
        const result = await sendToNumber(
          contact.phone,
          message,
          mediaFile?.url,
          caption,
          mediaFile?.mimetype
        );
        if (!result.success) { status = 'failed'; error = result.error; }
        else sent++;
      } catch (err) {
        status = 'failed';
        error = err.message;
      }

      if (status === 'failed') failed++;

      await prisma.campaignResult.create({
        data: { campaignId: campaign.id, contactId: contact.id, status, error },
      });

      // Update running totals
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { sent, failed },
      });

      if (io) {
        io.emit('campaign:progress', {
          campaignId: campaign.id,
          sent, failed,
          total: recipients.length,
          latest: { name: contact.name, phone: contact.phone, status, error },
        });
      }

      // Delay between messages
      if (i < recipients.length - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    // Mark completed
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'COMPLETED', completedAt: new Date(), sent, failed },
    });

    if (io) io.emit('campaign:done', { campaignId: campaign.id, sent, failed });
  })().catch(async (err) => {
    console.error('Campaign error:', err);
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'FAILED' },
    });
  });
});

// POST /api/campaigns/send-single
router.post('/send-single', async (req, res) => {
  const { phone, message, mediaFileId, caption, waStatus } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  if (waStatus !== 'ready') return res.status(503).json({ error: 'WhatsApp not connected' });

  let mediaFile = null;
  if (mediaFileId) {
    mediaFile = await prisma.mediaFile.findFirst({ where: { id: mediaFileId, userId: req.user.id } });
  }

  try {
    const result = await sendToNumber(
      phone.replace(/\D/g, ''),
      message,
      mediaFile?.url,
      caption,
      mediaFile?.mimetype
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, setIo };
