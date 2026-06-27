// lib/whatsapp.js – Singleton WhatsApp client (Railway/Cloud compatible)
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const https = require('https');

// ── Find Chrome/Chromium (env var → common paths) ──────────
function findChrome() {
  // 1. Explicit override via environment variable (set this on Railway)
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    const p = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (fs.existsSync(p)) {
      console.log('✅ Chrome from env PUPPETEER_EXECUTABLE_PATH:', p);
      return p;
    }
  }

  const paths = {
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    ],
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ],
    linux: [
      // Railway Nixpacks chromium
      '/nix/var/nix/profiles/default/bin/chromium',
      '/run/current-system/sw/bin/chromium',
      // Standard Linux paths
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      // Render / other cloud
      '/usr/local/bin/chromium',
    ],
  };

  const list = paths[process.platform] || paths.linux;
  for (const p of list) {
    try {
      if (p && fs.existsSync(p)) {
        console.log('✅ Chrome found at:', p);
        return p;
      }
    } catch (_) {}
  }

  console.warn('⚠️  Chrome not found at any known path. Letting Puppeteer decide.');
  return null;
}

const chromePath = findChrome();

const waClient = new Client({
  authStrategy: new LocalAuth({ clientId: 'wa-marketing-v2' }),
  puppeteer: {
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : {}),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--single-process',           // helps on constrained cloud envs
      '--disable-extensions',
    ],
  },
});

// ── Download a remote URL to a temp buffer for MessageMedia ─
async function downloadToBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Send a message to one number.
 * mediaUrl: public R2 URL of the file (optional)
 */
async function sendToNumber(phone, text, mediaUrl, caption, mimetype) {
  const chatId = phone.replace(/\D/g, '') + '@c.us';

  const isRegistered = await waClient.isRegisteredUser(chatId);
  if (!isRegistered) return { success: false, error: 'Not on WhatsApp' };

  if (mediaUrl) {
    const buffer = await downloadToBuffer(mediaUrl);
    const b64 = buffer.toString('base64');
    const media = new MessageMedia(mimetype || 'application/octet-stream', b64);
    await waClient.sendMessage(chatId, media, { caption: caption || text || '' });
  } else if (text) {
    await waClient.sendMessage(chatId, text);
  }

  return { success: true };
}

module.exports = { waClient, sendToNumber };
