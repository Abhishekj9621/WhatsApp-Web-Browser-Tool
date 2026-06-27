// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const qrcode = require('qrcode');

const prisma = require('./lib/prisma');
const { waClient } = require('./lib/whatsapp');
const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contacts');
const uploadRoutes = require('./routes/upload');
const { router: campaignRouter, setIo } = require('./routes/campaigns');

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Socket.IO ────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'] },
});
setIo(io); // inject into campaigns router

// ─── Security middleware ──────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Rate limit all API routes
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please slow down.' },
}));

// Stricter limit on auth endpoints
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts.' },
}));

// ─── Public routes (no auth) ──────────────────────────────
app.use('/api/auth', authRoutes);

// ─── WhatsApp status (public – frontend needs QR before login) ───
let clientStatus = 'disconnected';
let currentQR = null;

app.get('/api/wa/status', (req, res) => {
  res.json({ status: clientStatus, qr: currentQR });
});

app.post('/api/wa/logout', authMiddleware, async (req, res) => {
  try {
    await waClient.logout();
    clientStatus = 'disconnected';
    currentQR = null;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Protected routes ────────────────────────────────────
app.use('/api/contacts', authMiddleware, contactRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/campaigns', authMiddleware, campaignRouter);

// Dashboard stats
app.get('/api/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [totalContacts, totalCampaigns, aggSent, aggFailed] = await Promise.all([
      prisma.contact.count({ where: { userId, active: true } }),
      prisma.campaign.count({ where: { userId } }),
      prisma.campaign.aggregate({ where: { userId }, _sum: { sent: true } }),
      prisma.campaign.aggregate({ where: { userId }, _sum: { failed: true } }),
    ]);

    const recentCampaigns = await prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { mediaFile: { select: { originalName: true } } },
    });

    const groups = await prisma.contact.groupBy({
      by: ['group'],
      where: { userId, active: true },
      _count: { id: true },
    });

    res.json({
      totalContacts,
      totalCampaigns,
      totalSent: aggSent._sum.sent || 0,
      totalFailed: aggFailed._sum.failed || 0,
      recentCampaigns,
      groups: groups.map((g) => ({ name: g.group, count: g._count.id })),
      waStatus: clientStatus,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── WhatsApp events ──────────────────────────────────────
waClient.on('qr', async (qr) => {
  console.log('📱 New QR code generated');
  clientStatus = 'qr';
  currentQR = await qrcode.toDataURL(qr);
  io.emit('wa:status', { status: 'qr', qr: currentQR });
});

waClient.on('loading_screen', (percent, message) => {
  clientStatus = 'loading';
  io.emit('wa:status', { status: 'loading', percent, message });
});

waClient.on('authenticated', () => {
  console.log('✅ WhatsApp authenticated');
  clientStatus = 'authenticated';
  currentQR = null;
  io.emit('wa:status', { status: 'authenticated' });
});

waClient.on('auth_failure', (msg) => {
  console.error('❌ Auth failed:', msg);
  clientStatus = 'disconnected';
  io.emit('wa:status', { status: 'auth_failure', message: msg });
});

waClient.on('ready', () => {
  console.log('🚀 WhatsApp ready!');
  clientStatus = 'ready';
  currentQR = null;
  io.emit('wa:status', { status: 'ready' });
});

waClient.on('disconnected', (reason) => {
  console.log('⚠️  WhatsApp disconnected:', reason);
  clientStatus = 'disconnected';
  io.emit('wa:status', { status: 'disconnected', reason });
});

// ─── Socket.IO connection ─────────────────────────────────
io.on('connection', (socket) => {
  // Send current WA status immediately on connect
  socket.emit('wa:status', { status: clientStatus, qr: currentQR });
  socket.on('disconnect', () => {});
});

// ─── Health check ─────────────────────────────────────────
app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// ─── Error handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected');

    server.listen(PORT, () => {
      console.log(`\n🟢 Server running on http://localhost:${PORT}`);
      console.log('📲 Initializing WhatsApp...\n');
    });

    waClient.initialize().catch(console.error);
  } catch (err) {
    console.error('❌ Failed to start:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

start();
