const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Income = require('./models/Income');
const Expense = require('./models/Expense');
const Budget = require('./models/Budget');
const Transaction = require('./models/Transaction');
const AIReport = require('./models/AIReport');
const Goal = require('./models/Goal');

const MONGO_URI = 'mongodb://localhost:27017/smart-finance';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB. Wiping collections...');

    // Clear existing data
    await User.deleteMany({});
    await Income.deleteMany({});
    await Expense.deleteMany({});
    await Budget.deleteMany({});
    await Transaction.deleteMany({});
    await AIReport.deleteMany({});
    await Goal.deleteMany({});

    console.log('Collections cleared. Creating demo user...');

    // Create user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const user = await User.create({
      username: 'demo_user',
      email: 'demo@example.com',
      password: hashedPassword,
      profilePic: 'https://api.dicebear.com/7.x/bottts/svg?seed=demo_user',
      currency: 'INR'
    });

    console.log(`Demo user created: ${user.email} (password: password123)`);

    // Incomes data
    const activeMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const today = new Date();

    const incomesData = [
      {
        userId: user._id,
        amount: 85000,
        category: 'Salary',
        date: new Date(today.getFullYear(), today.getMonth(), 1), // 1st of month
        description: 'Monthly Corporate Salary Credit'
      },
      {
        userId: user._id,
        amount: 12500,
        category: 'Freelancing',
        date: new Date(today.getFullYear(), today.getMonth(), 10),
        description: 'UI Design Freelancing Project'
      },
      {
        userId: user._id,
        amount: 3200,
        category: 'Investments',
        date: new Date(today.getFullYear(), today.getMonth(), 15),
        description: 'Dividend payout'
      }
    ];

    const insertedIncomes = await Income.insertMany(incomesData);
    console.log('Income sources seeded.');

    // Expenses data
    const expensesData = [
      {
        userId: user._id,
        amount: 18000,
        category: 'Bills',
        date: new Date(today.getFullYear(), today.getMonth(), 2),
        description: 'House rent & electric bills'
      },
      {
        userId: user._id,
        amount: 12500, // Exceeds budget of 10000
        category: 'Food',
        date: new Date(today.getFullYear(), today.getMonth(), 5),
        description: 'Fine dining & groceries'
      },
      {
        userId: user._id,
        amount: 4500,
        category: 'Transport',
        date: new Date(today.getFullYear(), today.getMonth(), 8),
        description: 'Uber rides & fuel'
      },
      {
        userId: user._id,
        amount: 9800,
        category: 'Shopping',
        date: new Date(today.getFullYear(), today.getMonth(), 12),
        description: 'Buying clothes and sneakers'
      },
      {
        userId: user._id,
        amount: 3500,
        category: 'Entertainment',
        date: new Date(today.getFullYear(), today.getMonth(), 18),
        description: 'Netflix, cinema, and outings'
      },
      {
        userId: user._id,
        amount: 2200,
        category: 'Healthcare',
        date: new Date(today.getFullYear(), today.getMonth(), 20),
        description: 'Pharmacy & health checkup'
      }
    ];

    const insertedExpenses = await Expense.insertMany(expensesData);
    console.log('Expense entries seeded.');

    // Seed budgets
    const budgetsData = [
      {
        userId: user._id,
        category: 'Total',
        limit: 60000,
        month: activeMonth
      },
      {
        userId: user._id,
        category: 'Food',
        limit: 10000, // Food expense is 12500, triggers warning
        month: activeMonth
      },
      {
        userId: user._id,
        category: 'Shopping',
        limit: 12000,
        month: activeMonth
      },
      {
        userId: user._id,
        category: 'Transport',
        limit: 5000,
        month: activeMonth
      }
    ];

    await Budget.insertMany(budgetsData);
    console.log('Budget boundaries configured.');

    // Mirror to transaction ledger
    const transactionsData = [];
    insertedIncomes.forEach(inc => {
      transactionsData.push({
        userId: user._id,
        type: 'income',
        amount: inc.amount,
        category: inc.category,
        date: inc.date,
        description: inc.description,
        referenceId: inc._id
      });
    });

    insertedExpenses.forEach(exp => {
      transactionsData.push({
        userId: user._id,
        type: 'expense',
        amount: exp.amount,
        category: exp.category,
        date: exp.date,
        description: exp.description,
        referenceId: exp._id
      });
    });

    await Transaction.insertMany(transactionsData);
    console.log('Unified transaction logs synchronized.');

    // Pre-cache an initial AI Report to avoid requiring Gemini API on very first load
    const totalIncome = 85000 + 12500 + 3200;
    const totalExpense = 18000 + 12500 + 4500 + 9800 + 3500 + 2200;
    const currentBalance = totalIncome - totalExpense;
    const savingsRate = parseFloat(((currentBalance / totalIncome) * 100).toFixed(2));

    await AIReport.create({
      userId: user._id,
      month: activeMonth,
      healthScore: 78,
      healthStatus: 'Good',
      summary: `You generated a solid total of ₹${totalIncome.toLocaleString()} and spent ₹${totalExpense.toLocaleString()} this period, achieving a savings rate of ${savingsRate}%. However, you exceeded your set limit for Food, which represents a budget leak.`,
      spendingPatterns: [
        {
          category: 'Food',
          status: 'Overspent',
          description: `Spent ₹12,500, exceeding your ₹10,000 limit by ₹2,500.`
        },
        {
          category: 'Shopping',
          status: 'Healthy',
          description: 'Shopping is well under your set limit of ₹12,000.'
        }
      ],
      savingsSuggestions: [
        'Regulate dining out or food delivery orders to bring Food costs back under the ₹10,000 threshold.',
        'Increase mutual fund SIPs with your remaining ₹40,000 surplus balance.'
      ],
      recommendations: [
        'Establish a dedicated emergency savings reserve equal to 3 months of basic expenses.',
        'Keep tracking budget trends daily to monitor dining allocations.'
      ],
      predictiveAnalytics: {
        nextMonthExpenses: parseFloat((totalExpense * 1.02).toFixed(2)),
        expectedSavings: parseFloat((totalIncome - (totalExpense * 1.02)).toFixed(2)),
        spendingForecast: 'Stable: Projected expenses are safely within your income threshold. Focus on automated investments.'
      }
    });
    console.log('Initial AI Diagnostic Report cached.');

    const goalsData = [
      {
        userId: user._id,
        name: 'Emergency Savings Fund',
        targetAmount: 100000,
        currentSavings: 45000,
        targetDate: new Date(today.getFullYear(), today.getMonth() + 6, today.getDate()),
        category: 'savings',
        description: '6 months of basic living expenses',
        status: 'active'
      },
      {
        userId: user._id,
        name: 'Dream Europe Trip',
        targetAmount: 250000,
        currentSavings: 75000,
        targetDate: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()),
        category: 'travel',
        description: 'Summer trip to Italy & France',
        status: 'active'
      }
    ];

    await Goal.insertMany(goalsData);
    console.log('Financial goals seeded.');

    console.log('Database Seeding Complete! Waking down...');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  }
};

seedDatabase();
