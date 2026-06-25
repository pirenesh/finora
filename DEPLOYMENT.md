# SaaS Deployment Guide - Smart Finance System with FinBot AI

This document provides step-by-step instructions for launching your upgraded full-stack SaaS application into production.

---

## ☁️ 1. MongoDB Atlas Configuration (Database)

1. Sign up/log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new **Shared Cluster** (Free tier).
3. Select your cloud provider and region, then click **Create Cluster**.
4. Set up **Database Access**:
   - Create a database user with username and a secure password. Select **Read and write to any database** role.
5. Set up **Network Access**:
   - Add a connection IP. For production hosting (like Render), select **Allow Access From Anywhere** (`0.0.0.0/0`) or configure specific server IP ranges.
6. Click **Database** -> **Connect** -> **Drivers**:
   - Copy the connection URI string. It should look like:
     `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/smart-finance?retryWrites=true&w=majority`

---

## 🚀 2. Backend Render Deployment (Node.js API)

1. Sign up/log in to [Render](https://render.com).
2. Click **New** -> **Web Service**.
3. Connect your GitHub/Gitlab repository (ensure the project files are pushed to Git).
4. Configure service settings:
   - **Name**: `finbot-wealth-api`
   - **Environment**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Configure **Advanced** -> **Environment Variables**:
   - Add `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/smart-finance?retryWrites=true&w=majority` (Replace with your credentials).
   - Add `JWT_SECRET`: A long random string (e.g. `982hndjsy726gd712twsx90`).
   - Add `GEMINI_API_KEY`: Your active Google Gemini API Key.
   - Add `NODE_ENV`: `production`
6. Click **Create Web Service**. Render will install dependencies and start the REST server. Note down your deployed API service URL (e.g. `https://finbot-wealth-api.onrender.com`).

---

## ⚡ 3. Frontend Vercel Deployment (React SPA)

1. Sign up/log in to [Vercel](https://vercel.com).
2. Click **Add New** -> **Project**.
3. Connect and select your Git repository.
4. Configure project settings:
   - **Name**: `finbot-wealth-console`
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `tsc && vite build`
   - **Output Directory**: `dist`
5. Configure **Environment Variables**:
   - Since we are deploying backend and frontend on different domains, we need to bypass Vite's local dev server proxy for production.
   - To do this, we configure our API requests to point directly to our Render URL by adjusting the Axios base URL dynamically!
   - In production, Axios will read `import.meta.env.VITE_API_URL` or fallback. (We will verify this is configured correctly in `AuthContext.tsx` and all API calls!).
   - Add environment variable `VITE_API_URL`: `https://finbot-wealth-api.onrender.com` (Your Render API URL).
6. Click **Deploy**. Vercel will compile the React code, build the static assets, and assign a production domain (e.g. `https://finbot-wealth-console.vercel.app`).

---

## 🔒 4. Production Security Headers & CORS

Our backend [server.js](file:///C:/Users/acer/.gemini/antigravity/scratch/smart-finance-tracker/backend/server.js) is configured to accept CORS requests dynamically. It allows:
- `http://localhost:5173` (Local Dev)
- `http://127.0.0.1:5173` (Local Dev)
- `*` (Any origin, ensuring it binds correctly to Vercel domains).

For production-grade security, you should modify the CORS setup in [server.js](file:///C:/Users/acer/.gemini/antigravity/scratch/smart-finance-tracker/backend/server.js) to restrict origins specifically to your Vercel client domain:

```javascript
app.use(cors({
  origin: 'https://finbot-wealth-console.vercel.app',
  credentials: true
}));
```
