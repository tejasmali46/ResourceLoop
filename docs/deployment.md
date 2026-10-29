# ResourceLoop Deployment Guide

This guide covers deploying ResourceLoop to production environments with separate or unified frontend and backend hosting and a managed MongoDB instance (such as MongoDB Atlas).

---

## 1. Environment Configuration

Create a production `.env` file in `server/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database (e.g. MongoDB Atlas)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/resourceloop?retryWrites=true&w=majority

# Security
JWT_SECRET=generate_a_cryptographically_secure_64_character_random_string_here
JWT_EXPIRES_IN=7d

# Institution Details
INSTITUTION_NAME="Apex University of Technology & Sciences"
INSTITUTION_TIMEZONE="Asia/Kolkata"

# Optional Live AI Integration (Rule-based engine active when empty)
GEMINI_API_KEY=
```

---

## 2. Production Build

To compile both backend and frontend applications:

```bash
# In the project root:
npm run build
```

This compiles:
1. `server/dist/server.js` (Target: ES2022 Node.js)
2. `client/dist/` (Optimized production static assets, HTML, minified JS & CSS)

---

## 3. Database Seeding & Initialization

To initialize institutional departments, initial approval policies, demo users, and campus venues:

```bash
npm run seed
```

*Note: The seed script resets development collections cleanly. For production, ensure `NODE_ENV=production` is handled appropriately or create administrative users via the initial admin provisioning script.*

---

## 4. Hosting Strategies

### Option A: Unified Container / Node.js Host (Render, Railway, Heroku, VPS)
Run the server:
```bash
cd server
npm start
```
The Express server can serve the compiled frontend from `client/dist` statically or via reverse proxy.

### Option B: Decoupled Frontend (Vercel / Netlify / Cloudflare Pages) & Backend (Render / VPS)
1. Deploy `client` folder to Vercel or Cloudflare Pages.
2. Set `VITE_API_BASE_URL` or configure proxy to point to the backend domain.
3. Deploy `server` to a Node.js cloud provider with MongoDB Atlas connection.

---

## 5. Health Check Monitoring

The server exposes a zero-dependency health check endpoint:
```
GET /health
```
**Response**:
```json
{
  "status": "UP",
  "timestamp": "2026-10-28T20:00:00.000Z",
  "service": "ResourceLoop Core API",
  "version": "1.0.0"
}
```
Use this endpoint with Pingdom, UptimeRobot, or Kubernetes liveness probes.
