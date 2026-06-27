<div align="center">

# 📲 WA Marketing

**Self-hosted WhatsApp bulk messaging dashboard — no API fees, no third-party limits.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white)](https://prisma.io)
[![Deploy on Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway)](https://railway.app)

</div>

---

## What it does

WA Marketing lets you send bulk WhatsApp messages — text or media — directly from your own WhatsApp account via a web dashboard. No Meta Business API, no per-message fees, no third-party platform lock-in.

---

## Features

- 🔐 JWT authentication
- 📱 WhatsApp login via QR scan (powered by whatsapp-web.js)
- 👥 Contact management — add, edit, group, bulk CSV import
- 📤 Send text & media campaigns (images, documents, video)
- ☁️ Cloudflare R2 media storage
- 📊 Campaign history & delivery tracking
- ⚡ Real-time updates via Socket.IO

---

## Tech Stack

| | Technology |
|---|---|
| **Frontend** | React 18, Socket.IO Client |
| **Backend** | Node.js, Express, Socket.IO |
| **WhatsApp** | whatsapp-web.js, Puppeteer, Google Chrome |
| **Database** | PostgreSQL + Prisma ORM |
| **Storage** | Cloudflare R2 |
| **Auth** | JWT |
| **Deployment** | Docker, Railway, Vercel |

---

## Architecture

Vercel (React frontend)  ──►  Railway (Node.js + Puppeteer)  ──►  PostgreSQL
                                        │
                                 Cloudflare R2
                               (media file storage)

---

## Deployment

| Service | Platform |
|---|---|
| Backend | [Railway](https://railway.app) — auto-detects `backend/Dockerfile` |
| Frontend | [Vercel](https://vercel.com) — set root dir to `frontend` |
| Database | Railway PostgreSQL addon |
| Media | Cloudflare R2 |

Set `REACT_APP_API_URL` on Vercel and `FRONTEND_URL` on Railway to wire them together.  
See `.env.example` for all required environment variables.

---

## Use Cases

- WhatsApp marketing campaigns for small businesses
- Bulk order/appointment notifications
- Internal team broadcast messaging
- Client demo for WhatsApp automation tooling

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

<div align="center">
  <sub>Built with whatsapp-web.js · Not affiliated with WhatsApp or Meta</sub>
</div>
