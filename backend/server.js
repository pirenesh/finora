const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// Route imports
const authRoutes = require('./routes/authRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const aiRoutes = require('./routes/aiRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const debtRoutes = require('./routes/debtRoutes');
const plaidRoutes = require('./routes/plaidRoutes');
const goalRoutes = require('./routes/goalRoutes');
const bankLoanRoutes = require('./routes/bankLoanRoutes');
const securityRoutes = require('./routes/securityRoutes');
const marketRoutes = require('./routes/marketRoutes');

// Load environment variables
dotenv.config();
console.log("GEMINI =", process.env.GEMINI_API_KEY ? "FOUND" : "NOT FOUND");

// Connect database
connectDB();

const app = express();

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', '*'],
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Set Security HTTP Headers
app.use(helmet());

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data Sanitization against XSS
app.use(xss());

// Rate Limiting (Global)
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour.'
});
app.use('/api', limiter);

// Basic Status Check
app.get('/api/status', (req, res) => {
  res.status(200).json({ success: true, message: 'Smart Finance API is active and running.' });
});

// Self-Hosted API Documentation
app.get('/api/docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FinBot AI REST API Documentation</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 0; }
        header { background: linear-gradient(135deg, #8b5cf6, #06b6d4); padding: 30px 40px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        header h1 { margin: 0; font-size: 24px; font-weight: 800; }
        header p { margin: 5px 0 0 0; font-size: 13px; opacity: 0.85; font-weight: 500; }
        main { max-width: 1100px; margin: 40px auto; padding: 0 20px; }
        .section-title { font-size: 16px; font-weight: 700; text-transform: uppercase; tracking-spacing: 0.1em; color: #a78bfa; margin-bottom: 20px; border-left: 4px solid #8b5cf6; padding-left: 10px; }
        .endpoint-card { background: #151c2c; border: 1px solid #222f47; border-radius: 16px; padding: 20px; margin-bottom: 20px; transition: all 0.2s ease; }
        .endpoint-card:hover { border-color: rgba(139,92,246,0.3); }
        .badge { display: inline-block; padding: 5px 10px; border-radius: 8px; font-family: 'Fira Code', monospace; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-right: 12px; }
        .get { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
        .post { background: rgba(59,130,246,0.1); color: #3b82f6; border: 1px solid rgba(59,130,246,0.2); }
        .put { background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
        .delete { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
        .path { font-family: 'Fira Code', monospace; font-size: 14px; font-weight: 600; color: #f3f4f6; }
        .desc { font-size: 13px; color: #9ca3af; margin: 10px 0 15px 0; line-height: 1.5; }
        .meta { display: flex; gap: 15px; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; }
        .meta span { display: flex; items-center: center; gap: 4px; }
        .auth-badge { background: #222f47; color: #06b6d4; padding: 2px 6px; border-radius: 4px; font-size: 10px; }
        code { font-family: 'Fira Code', monospace; background: #0e1422; padding: 12px; border-radius: 12px; display: block; border: 1px solid #1f2937; margin-top: 10px; font-size: 12px; color: #e5e7eb; overflow-x: auto; }
      </style>
    </head>
    <body>
      <header>
        <h1>FinBot AI Wealth API</h1>
        <p>Production SaaS Reference Documentation v1.0.0</p>
      </header>
      <main>
        <div class="section-title">Auth Endpoints</div>
        
        <div class="endpoint-card">
          <div style="display:flex; align-items:center;">
            <span class="badge post">POST</span>
            <span class="path">/api/auth/register</span>
          </div>
          <p class="desc">Registers a new account. Free tier role set by default.</p>
          <div class="meta">
            <span>Auth: <span class="auth-badge" style="background:#ef4444/10;color:#ef4444;">None</span></span>
          </div>
          <code>
            Request Body:<br>
            {<br>
            &nbsp;&nbsp;"username": "john_doe",<br>
            &nbsp;&nbsp;"email": "john@example.com",<br>
            &nbsp;&nbsp;"password": "secretpassword"<br>
            }
          </code>
        </div>

        <div class="endpoint-card">
          <div style="display:flex; align-items:center;">
            <span class="badge post">POST</span>
            <span class="path">/api/auth/login</span>
          </div>
          <p class="desc">Authenticates user and returns JWT token.</p>
          <div class="meta">
            <span>Auth: <span class="auth-badge" style="background:#ef4444/10;color:#ef4444;">None</span></span>
          </div>
          <code>
            Request Body:<br>
            {<br>
            &nbsp;&nbsp;"emailOrUsername": "john@example.com",<br>
            &nbsp;&nbsp;"password": "secretpassword"<br>
            }
          </code>
        </div>

        <div class="section-title">Wealth Ledgers</div>

        <div class="endpoint-card">
          <div style="display:flex; align-items:center;">
            <span class="badge get">GET</span>
            <span class="path">/api/transactions</span>
          </div>
          <p class="desc">Retrieves unified list of all transactions with filters.</p>
          <div class="meta">
            <span>Auth: <span class="auth-badge">JWT Bearer Token</span></span>
            <span>Query Params: search, type, category, startDate, endDate, sortBy, sortOrder</span>
          </div>
        </div>

        <div class="endpoint-card">
          <div style="display:flex; align-items:center;">
            <span class="badge post">POST</span>
            <span class="path">/api/expense</span>
          </div>
          <p class="desc">Creates a debit record and mirrors transaction.</p>
          <div class="meta">
            <span>Auth: <span class="auth-badge">JWT Bearer Token</span></span>
          </div>
          <code>
            Request Body:<br>
            {<br>
            &nbsp;&nbsp;"amount": 450.00,<br>
            &nbsp;&nbsp;"category": "Food",<br>
            &nbsp;&nbsp;"date": "2026-06-22",<br>
            &nbsp;&nbsp;"description": "Team lunch"<br>
            }
          </code>
        </div>

        <div class="section-title">FinBot AI & Reports</div>

        <div class="endpoint-card">
          <div style="display:flex; align-items:center;">
            <span class="badge post">POST</span>
            <span class="path">/api/ai/chat</span>
          </div>
          <p class="desc">Interacts with FinBot AI with chat logs context. Requires PRO role.</p>
          <div class="meta">
            <span>Auth: <span class="auth-badge">JWT Bearer Token</span></span>
            <span>Subscription: <span class="auth-badge" style="background:#8b5cf6/15;color:#c084fc;">Pro Tier</span></span>
          </div>
        </div>

        <div class="section-title">Life Goal Planner</div>

        <div class="endpoint-card">
          <div style="display:flex; align-items:center;">
            <span class="badge get">GET</span>
            <span class="path">/api/goals</span>
          </div>
          <p class="desc">Retrieves all financial life goals for the authenticated user.</p>
          <div class="meta">
            <span>Auth: <span class="auth-badge">JWT Bearer Token</span></span>
          </div>
        </div>

        <div class="endpoint-card">
          <div style="display:flex; align-items:center;">
            <span class="badge post">POST</span>
            <span class="path">/api/goals</span>
          </div>
          <p class="desc">Creates a new financial life goal.</p>
          <div class="meta">
            <span>Auth: <span class="auth-badge">JWT Bearer Token</span></span>
          </div>
          <code>
            Request Body:<br>
            {<br>
            &nbsp;&nbsp;"name": "Dream House Downpayment",<br>
            &nbsp;&nbsp;"targetAmount": 1500000,<br>
            &nbsp;&nbsp;"currentSavings": 100000,<br>
            &nbsp;&nbsp;"targetDate": "2029-12-31",<br>
            &nbsp;&nbsp;"category": "housing",<br>
            &nbsp;&nbsp;"description": "10% downpayment on 3BHK flat"<br>
            }
          </code>
        </div>
      </main>
    </body>
    </html>
  `);
});

// Routes mounting
app.use('/api/auth', authRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/debt', debtRoutes);
app.use('/api/plaid', plaidRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/loans', bankLoanRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/market', marketRoutes);
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Latest backend is running'
  });
});


// Catch-all route error fallback
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});