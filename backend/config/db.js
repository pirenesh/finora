const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// In-memory database storage
global.mockDb = {
  users: [],
  incomes: [],
  expenses: [],
  budgets: [],
  transactions: [],
  aiReports: [],
  debts: [],
  bankConnections: [],
  goals: []
};
global.useMockDb = false;

const seedMockDb = () => {
  console.log('Seeding mock database in-memory...');
  
  // Create user
  const hashedPassword = bcrypt.hashSync('password123', 10);
  const demoUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'demo_user',
    email: 'demo@example.com',
    password: hashedPassword,
    profilePic: 'https://api.dicebear.com/7.x/bottts/svg?seed=demo_user',
    currency: 'INR',
    createdAt: new Date()
  };
  global.mockDb.users.push(demoUser);

  // Budgets
  const activeMonth = new Date().toISOString().slice(0, 7);
  const budgets = [
    { _id: '1', userId: demoUser._id, category: 'Total', limit: 60000, month: activeMonth },
    { _id: '2', userId: demoUser._id, category: 'Food', limit: 10000, month: activeMonth },
    { _id: '3', userId: demoUser._id, category: 'Shopping', limit: 12000, month: activeMonth },
    { _id: '4', userId: demoUser._id, category: 'Transport', limit: 5000, month: activeMonth }
  ];
  global.mockDb.budgets = budgets;

  // Incomes
  const today = new Date();
  const incomes = [
    {
      _id: '10',
      userId: demoUser._id,
      amount: 85000,
      category: 'Salary',
      date: new Date(today.getFullYear(), today.getMonth(), 1),
      description: 'Monthly Corporate Salary Credit'
    },
    {
      _id: '11',
      userId: demoUser._id,
      amount: 12500,
      category: 'Freelancing',
      date: new Date(today.getFullYear(), today.getMonth(), 10),
      description: 'UI Design Freelancing Project'
    },
    {
      _id: '12',
      userId: demoUser._id,
      amount: 3200,
      category: 'Investments',
      date: new Date(today.getFullYear(), today.getMonth(), 15),
      description: 'Dividend payout'
    }
  ];
  global.mockDb.incomes = incomes;

  // Expenses
  const expenses = [
    {
      _id: '20',
      userId: demoUser._id,
      amount: 18000,
      category: 'Bills',
      date: new Date(today.getFullYear(), today.getMonth(), 2),
      description: 'House rent & electric bills'
    },
    {
      _id: '21',
      userId: demoUser._id,
      amount: 12500,
      category: 'Food',
      date: new Date(today.getFullYear(), today.getMonth(), 5),
      description: 'Fine dining & groceries'
    },
    {
      _id: '22',
      userId: demoUser._id,
      amount: 4500,
      category: 'Transport',
      date: new Date(today.getFullYear(), today.getMonth(), 8),
      description: 'Uber rides & fuel'
    },
    {
      _id: '23',
      userId: demoUser._id,
      amount: 9800,
      category: 'Shopping',
      date: new Date(today.getFullYear(), today.getMonth(), 12),
      description: 'Buying clothes and sneakers'
    },
    {
      _id: '24',
      userId: demoUser._id,
      amount: 3500,
      category: 'Entertainment',
      date: new Date(today.getFullYear(), today.getMonth(), 18),
      description: 'Netflix, cinema, and outings'
    },
    {
      _id: '25',
      userId: demoUser._id,
      amount: 2200,
      category: 'Healthcare',
      date: new Date(today.getFullYear(), today.getMonth(), 20),
      description: 'Pharmacy & health checkup'
    }
  ];
  global.mockDb.expenses = expenses;

  // Transactions
  incomes.forEach(inc => {
    global.mockDb.transactions.push({
      _id: 't' + inc._id,
      userId: demoUser._id,
      type: 'income',
      amount: inc.amount,
      category: inc.category,
      date: inc.date,
      description: inc.description,
      referenceId: inc._id
    });
  });

  expenses.forEach(exp => {
    global.mockDb.transactions.push({
      _id: 't' + exp._id,
      userId: demoUser._id,
      type: 'expense',
      amount: exp.amount,
      category: exp.category,
      date: exp.date,
      description: exp.description,
      referenceId: exp._id
    });
  });

  // AI Report
  const totalIncome = 85000 + 12500 + 3200;
  const totalExpense = 18000 + 12500 + 4500 + 9800 + 3500 + 2200;
  const currentBalance = totalIncome - totalExpense;
  const savingsRate = parseFloat(((currentBalance / totalIncome) * 100).toFixed(2));

  const report = {
    _id: '507f1f77bcf86cd799439022',
    userId: demoUser._id,
    month: activeMonth,
    healthScore: 78,
    healthStatus: 'Good',
    summary: `You generated a solid total of ₹${totalIncome.toLocaleString()} and spent ₹${totalExpense.toLocaleString()} this period, achieving a savings rate of ${savingsRate}%. However, you exceeded your set limit for Food, which represents a budget leak.`,
    spendingPatterns: [
      { category: 'Food', status: 'Overspent', description: `Spent ₹12,500, exceeding your ₹10,000 limit by ₹2,500.` },
      { category: 'Shopping', status: 'Healthy', description: 'Shopping is well under your set limit of ₹12,000.' }
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
    },
    generatedAt: new Date()
  };
  global.mockDb.aiReports.push(report);

  // Seed Debts
  const monthsAgo = (n) => {
    const d = new Date();
    d.setMonth(d.getMonth() - n);
    return d;
  };
  
  global.mockDb.debts = [
    {
      _id: 'd1',
      userId: demoUser._id,
      lenderBorrowerName: 'HDFC Personal Bank',
      type: 'borrowed',
      amount: 50000,
      interestRate: 12,
      interestPeriod: 'yearly',
      interestType: 'compound',
      startDate: monthsAgo(6),
      dueDate: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()),
      description: 'Medical emergency loan backup',
      status: 'active',
      repayments: [
        {
          _id: 'r1',
          amount: 15000,
          date: monthsAgo(3),
          description: 'First quarterly repayment'
        }
      ],
      createdAt: new Date()
    },
    {
      _id: 'd2',
      userId: demoUser._id,
      lenderBorrowerName: 'Vikram Sharma (Colleague)',
      type: 'lent',
      amount: 12000,
      interestRate: 2,
      interestPeriod: 'monthly',
      interestType: 'simple',
      startDate: monthsAgo(1),
      description: 'Lent for laptop buying help',
      status: 'active',
      repayments: [],
      createdAt: new Date()
    }
  ];

  // Seed Mock Bank Connection
  global.mockDb.bankConnections = [
    {
      _id: 'c1',
      userId: demoUser._id,
      institutionId: 'ins_109',
      institutionName: 'Chase Bank (Sandbox)',
      itemId: 'item_chase_demo',
      accessToken: 'access_mock_chase_demo',
      accounts: [
        { accountId: 'acc_chase_checking', name: 'Chase College Checking', mask: '1822', type: 'depository', subtype: 'checking', balance: 5230.12 },
        { accountId: 'acc_chase_savings', name: 'Chase Premium Savings', mask: '5420', type: 'depository', subtype: 'savings', balance: 45600.50 }
      ],
      lastSynced: monthsAgo(1),
      createdAt: new Date()
    }
  ];

  // Seed Goals
  global.mockDb.goals = [
    {
      _id: 'g1',
      userId: demoUser._id,
      name: 'Emergency Savings Fund',
      targetAmount: 100000,
      currentSavings: 45000,
      targetDate: new Date(today.getFullYear(), today.getMonth() + 6, today.getDate()),
      category: 'savings',
      description: '6 months of basic living expenses',
      status: 'active',
      createdAt: new Date()
    },
    {
      _id: 'g2',
      userId: demoUser._id,
      name: 'Dream Europe Trip',
      targetAmount: 250000,
      currentSavings: 75000,
      targetDate: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()),
      category: 'travel',
      description: 'Summer trip to Italy & France',
      status: 'active',
      createdAt: new Date()
    }
  ];

  console.log('Mock database seeded successfully! Ready for dry execution.');
};

const connectDB = async () => {
  try {
 const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const conn = await mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  family: 4
});
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`\n⚠️ MongoDB Connection Failed: ${error.message}`);
    console.warn(`⚠️ Booting in-memory Mock Database fallback. All operations will save in memory.\n`);
    global.useMockDb = true;
    seedMockDb();
  }
};

module.exports = connectDB;
