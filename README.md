# 📣 WhatsApp Marketing Dashboard v2

**Production-grade** WhatsApp marketing tool with PostgreSQL, JWT auth, Cloudflare R2 storage, and PM2.

---

## 🏗️ Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + Express |
| Database | **PostgreSQL** via **Prisma ORM** |
| Auth | **JWT** (bcrypt + jsonwebtoken) |
| File Storage | **Cloudflare R2** (S3-compatible, zero egress fees) |
| WhatsApp | whatsapp-web.js (unofficial) |
| Realtime | Socket.IO |
| Process Manager | **PM2** |
| Frontend | React 18 |

---

## 📁 Structure

```
wa-marketing-v2/
├── backend/
│   ├── lib/
│   │   ├── prisma.js       ← PostgreSQL client singleton
│   │   ├── r2.js           ← Cloudflare R2 upload/delete
│   │   └── whatsapp.js     ← WA client + send helper
│   ├── middleware/
│   │   └── auth.js         ← JWT auth middleware
│   ├── prisma/
│   │   └── schema.prisma   ← DB schema (User, Contact, Campaign, etc.)
│   ├── routes/
│   │   ├── auth.js         ← /api/auth/login|register|me|create-user
│   │   ├── contacts.js     ← /api/contacts CRUD + bulk
│   │   ├── upload.js       ← /api/upload → R2
│   │   └── campaigns.js    ← /api/campaigns create+run
│   ├── server.js           ← Main server
│   ├── ecosystem.config.js ← PM2 config
│   ├── .env.example        ← Copy to .env and fill in
│   └── .npmrc              ← Skips Puppeteer browser download
└── frontend/
    └── src/
        ├── context/
        │   ├── AuthContext.js  ← JWT token management
        │   └── WaContext.js    ← WA + API state
        ├── pages/
        │   ├── Login.js
        │   ├── Dashboard.js
        │   ├── Contacts.js
        │   ├── Compose.js
        │   └── History.js
        └── components/
            └── Sidebar.js
```

---

## 🚀 Setup

### 1. PostgreSQL
Install PostgreSQL and create a database:
```sql
CREATE DATABASE wa_marketing;
CREATE USER wa_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE wa_marketing TO wa_user;
```

### 2. Cloudflare R2
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **R2 Object Storage**
2. Create a bucket (e.g. `wa-marketing-media`)
3. Go to **R2 Overview → Manage R2 API Tokens → Create Token**
   - Permission: **Object Read & Write**
   - Scope: your bucket
4. Copy **Account ID**, **Access Key ID**, **Secret Access Key**
5. Enable **Public Access** on your bucket → copy the `pub-xxxx.r2.dev` URL

### 3. Backend setup
```powershell
cd backend

# 1. Copy and fill in environment variables
copy .env.example .env
# Edit .env with your DB URL, JWT secret, R2 credentials

# 2. Install dependencies (skips Puppeteer download)
$env:PUPPETEER_SKIP_DOWNLOAD="true"; npm install

# 3. Generate Prisma client and push schema to DB
npx prisma generate
npx prisma db push

# 4. Start in dev mode
npm run dev

# OR start with PM2 (production)
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # auto-start on reboot
```

### 4. Frontend setup
```powershell
cd frontend
npm install
npm start
```

Open http://localhost:3000

---

## 🔐 First Login

1. Open the app → you'll see a **Register** form
2. Fill in your name, email, password → creates the **admin** account
3. After that, registration is locked — admin can add users via API:
   ```http
   POST /api/auth/create-user
   Authorization: Bearer <token>
   { "name": "...", "email": "...", "password": "...", "role": "VIEWER" }
   ```

---

## 📱 Connect WhatsApp

1. After login, QR code appears on Dashboard
2. Open WhatsApp → Linked Devices → Link a Device → Scan
3. Session saved in `.wwebjs_auth/` — persists across restarts

---

## 📋 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | First-time setup only |
| POST | `/api/auth/login` | No | Get JWT token |
| GET | `/api/auth/me` | Yes | Current user |
| POST | `/api/auth/create-user` | Admin | Add new user |

### WhatsApp
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/wa/status` | No | WA connection status |
| POST | `/api/wa/logout` | Yes | Disconnect WA |

### Contacts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/contacts` | Yes | List (with ?search=&group=) |
| GET | `/api/contacts/groups` | Yes | Groups with counts |
| POST | `/api/contacts` | Yes | Add contact |
| POST | `/api/contacts/bulk` | Yes | Bulk import |
| PUT | `/api/contacts/:id` | Yes | Update |
| DELETE | `/api/contacts/:id` | Yes | Soft delete |

### Upload (Cloudflare R2)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload` | Yes | Upload file → R2 |
| GET | `/api/upload` | Yes | List my uploads |
| DELETE | `/api/upload/:id` | Yes | Delete from R2 |

### Campaigns
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/campaigns` | Yes | List campaigns |
| GET | `/api/campaigns/:id` | Yes | Campaign + results |
| POST | `/api/campaigns` | Yes | Create and run |
| POST | `/api/campaigns/send-single` | Yes | Quick single message |

### Dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard` | Yes | Stats + recent data |

---

## ⚙️ PM2 Commands

```bash
pm2 start ecosystem.config.js --env production  # start
pm2 restart wa-marketing                         # restart
pm2 stop wa-marketing                            # stop
pm2 logs wa-marketing                            # view logs
pm2 monit                                        # live dashboard
pm2 status                                       # status
```

Logs saved to `backend/logs/out.log` and `backend/logs/error.log`.

---

## .gitignore

```
backend/node_modules/
frontend/node_modules/
backend/.wwebjs_auth/        # WhatsApp session - NEVER commit
backend/.wwebjs_cache/
backend/.env                 # Secrets - NEVER commit
backend/logs/
frontend/build/
.DS_Store
Thumbs.db
```

---

## ⚠️ Disclaimer

whatsapp-web.js is unofficial and not affiliated with WhatsApp/Meta. For high-volume production use, consider the official WhatsApp Business API via Twilio, 360dialog, or Meta directly.
