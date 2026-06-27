// routes/upload.js
const router = require('express').Router();
const multer = require('multer');
const { uploadToR2, deleteFromR2 } = require('../lib/r2');
const prisma = require('../lib/prisma');

// Store in memory so we can pipe to R2 (no local disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|avi|mov|mkv|pdf|doc|docx/;
    if (allowed.test(file.mimetype) || allowed.test(file.originalname.toLowerCase())) {
      return cb(null, true);
    }
    cb(new Error('Unsupported file type'));
  },
});

// POST /api/upload
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const { key, url } = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype);

    // Persist to DB
    const media = await prisma.mediaFile.create({
      data: {
        originalName: req.file.originalname,
        filename: key,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url,
        userId: req.user.id,
      },
    });

    res.status(201).json(media);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/upload  – list my uploaded files
router.get('/', async (req, res) => {
  try {
    const files = await prisma.mediaFile.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/upload/:id
router.delete('/:id', async (req, res) => {
  try {
    const file = await prisma.mediaFile.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!file) return res.status(404).json({ error: 'File not found' });

    await deleteFromR2(file.filename);
    await prisma.mediaFile.delete({ where: { id: file.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
