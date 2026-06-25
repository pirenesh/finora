const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const BankConnection = require('../models/BankConnection');
const Transaction = require('../models/Transaction');
const Expense = require('../models/Expense');
const Income = require('../models/Income');

// Plaid client config
const plaidClientId = process.env.PLAID_CLIENT_ID || '';
const plaidSecret = process.env.PLAID_SECRET || '';
const plaidEnv = process.env.PLAID_ENV || 'sandbox';

const useMockPlaid = !plaidClientId || !plaidSecret || global.useMockDb;

let client;
if (!useMockPlaid) {
  const configuration = new Configuration({
    basePath: PlaidEnvironments[plaidEnv],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': plaidClientId,
        'PLAID-SECRET': plaidSecret,
      },
    },
  });
  client = new PlaidApi(configuration);
}

// Helper to generate mock transactions for Plaid simulation
const getMockPlaidTransactions = () => {
  const today = new Date();
  const daysAgo = (n) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - n);

  return [
    { name: 'Netflix India', amount: 649, type: 'expense', category: 'Entertainment', date: daysAgo(1), description: 'Recurring entertainment subscription' },
    { name: 'Uber Ride City', amount: 350, type: 'expense', category: 'Transport', date: daysAgo(2), description: 'City taxi commute' },
    { name: 'Starbucks Coffee', amount: 420, type: 'expense', category: 'Food', date: daysAgo(3), description: 'Beverages and snacks' },
    { name: 'Upwork Freelance Credit', amount: 8500, type: 'income', category: 'Freelancing', date: daysAgo(4), description: 'Client project contract credit' },
    { name: 'Amazon Shopping', amount: 2450, type: 'expense', category: 'Shopping', date: daysAgo(5), description: 'General household supplies' },
    { name: 'AWS Cloud Services', amount: 1540, type: 'expense', category: 'Bills', date: daysAgo(7), description: 'Server hosting bill' }
  ];
};

// Helper to generate Indian UPI mock transactions for simulation
const getMockIndianTransactions = () => {
  const today = new Date();
  const daysAgo = (n) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - n);

  return [
    { name: 'Zomato Food Delivery', amount: 480, type: 'expense', category: 'Food', date: daysAgo(1), description: 'UPI Debit to Zomato' },
    { name: 'Airtel Broadband Bill', amount: 943, type: 'expense', category: 'Bills', date: daysAgo(2), description: 'UPI Debit to Airtel' },
    { name: 'Amazon India Shopping', amount: 1599, type: 'expense', category: 'Shopping', date: daysAgo(3), description: 'IMPS Debit for Shopping' },
    { name: 'UPI Received (Amit Sharma)', amount: 2000, type: 'income', category: 'Freelancing', date: daysAgo(4), description: 'UPI Credit from Amit' },
    { name: 'TCS Monthly Salary', amount: 75000, type: 'income', category: 'Salary', date: daysAgo(5), description: 'Corporate NEFT Salary Credit' }
  ];
};

// @desc    Create Plaid Link Token
// @route   POST /api/plaid/create-link-token
// @access  Private
const createLinkToken = async (req, res, next) => {
  try {
    if (useMockPlaid) {
      return res.status(200).json({
        success: true,
        link_token: 'mock-link-token-' + Math.random().toString(36).substring(7),
        is_mock: true
      });
    }

    const plaidRequest = {
      user: {
        client_user_id: req.user._id.toString(),
      },
      client_name: 'FinBot AI Wealth SaaS',
      products: ['auth', 'transactions'],
      language: 'en',
      country_codes: ['US', 'IN'],
    };

    const response = await client.linkTokenCreate(plaidRequest);
    res.status(200).json({ success: true, link_token: response.data.link_token, is_mock: false });
  } catch (error) {
    console.error('Plaid Link Token error:', error);
    res.status(200).json({
      success: true,
      link_token: 'mock-link-token-' + Math.random().toString(36).substring(7),
      is_mock: true,
      warning: 'Fell back to mock due to API configurations.'
    });
  }
};

// @desc    Exchange Public Token for Access Token
// @route   POST /api/plaid/exchange-public-token
// @access  Private
const exchangePublicToken = async (req, res, next) => {
  try {
    const { publicToken, institutionName, institutionId, isMock } = req.body;

    if (!publicToken) {
      res.status(400);
      throw new Error('Public token is required');
    }

    const userId = req.user._id;

    if (isMock || useMockPlaid) {
      const mockConnection = {
        _id: Math.random().toString(36).substring(7),
        userId: userId.toString(),
        connectionType: 'plaid',
        institutionId: institutionId || 'ins_109',
        institutionName: institutionName || 'Chase Bank (Sandbox)',
        itemId: 'item_' + Math.random().toString(36).substring(7),
        accessToken: 'access_mock_' + Math.random().toString(36).substring(7),
        accounts: [
          { accountId: 'acc_1', name: 'Primary Checking', mask: '4829', type: 'depository', subtype: 'checking', balance: 45230.50 },
          { accountId: 'acc_2', name: 'Premium Savings', mask: '9921', type: 'depository', subtype: 'savings', balance: 245600.00 }
        ],
        lastSynced: new Date(),
        createdAt: new Date()
      };

      if (global.useMockDb) {
        if (!global.mockDb.bankConnections) global.mockDb.bankConnections = [];
        global.mockDb.bankConnections.push(mockConnection);
      } else {
        await BankConnection.create(mockConnection);
      }

      return res.status(201).json({ success: true, data: mockConnection });
    }

    const response = await client.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    const accountsResponse = await client.accountsGet({
      access_token: accessToken,
    });

    const accounts = accountsResponse.data.accounts.map(acc => ({
      accountId: acc.account_id,
      name: acc.name,
      mask: acc.mask,
      type: acc.type,
      subtype: acc.subtype,
      balance: acc.balances.current || 0
    }));

    const connection = await BankConnection.create({
      userId,
      connectionType: 'plaid',
      institutionId: institutionId || 'ins_plaid',
      institutionName: institutionName || 'Connected Bank',
      itemId,
      accessToken,
      accounts
    });

    res.status(201).json({ success: true, data: connection });
  } catch (error) {
    next(error);
  }
};

// @desc    Link manual Indian Bank Account (Account Number + IFSC)
// @route   POST /api/plaid/link-indian
// @access  Private
const linkIndianAccount = async (req, res, next) => {
  try {
    const { bankName, accountHolderName, accountNumber, ifscCode, balance } = req.body;

    if (!bankName || !accountHolderName || !accountNumber || !ifscCode) {
      res.status(400);
      throw new Error('Please fill in bank name, account holder name, account number, and IFSC code');
    }

    const userId = req.user._id;
    const initialBalance = parseFloat(balance || 0);

    const mask = accountNumber.slice(-4);
    const mongoose = require('mongoose');
    const mockId = new mongoose.Types.ObjectId();

    const newConnection = {
      _id: mockId,
      userId: userId,
      connectionType: 'indian_manual',
      institutionId: 'ins_manual_' + bankName.toLowerCase().replace(/\s+/g, '_'),
      institutionName: bankName,
      accountNumber: '•••• •••• ' + mask,
      ifscCode,
      accountHolderName,
      accounts: [
        {
          accountId: 'acc_' + mockId,
          name: bankName + ' Account',
          mask: mask,
          type: 'depository',
          subtype: 'checking',
          balance: initialBalance
        }
      ],
      lastSynced: new Date(),
      createdAt: new Date()
    };

    if (global.useMockDb) {
      if (!global.mockDb.bankConnections) global.mockDb.bankConnections = [];
      global.mockDb.bankConnections.push(newConnection);
    } else {
      await BankConnection.create(newConnection);
    }

    res.status(201).json({ success: true, data: newConnection });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Connected Institutions
// @route   GET /api/plaid/connections
// @access  Private
const getConnections = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (global.useMockDb) {
      const userConnections = (global.mockDb.bankConnections || [])
        .filter(c => c.userId.toString() === userId.toString());
      return res.status(200).json({ success: true, count: userConnections.length, data: userConnections });
    }

    const connections = await BankConnection.find({ userId });
    res.status(200).json({ success: true, count: connections.length, data: connections });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Connected Bank Institution
// @route   DELETE /api/plaid/connections/:id
// @access  Private
const deleteConnection = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (global.useMockDb) {
      const idx = (global.mockDb.bankConnections || []).findIndex(c => c._id.toString() === req.params.id);
      if (idx === -1) {
        res.status(404);
        throw new Error('Connection record not found');
      }

      if (global.mockDb.bankConnections[idx].userId.toString() !== userId.toString()) {
        res.status(401);
        throw new Error('Not authorized');
      }

      global.mockDb.bankConnections.splice(idx, 1);
      return res.status(200).json({ success: true, data: {} });
    }

    const connection = await BankConnection.findById(req.params.id);
    if (!connection) {
      res.status(404);
      throw new Error('Connection record not found');
    }

    if (connection.userId.toString() !== userId.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    await BankConnection.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// @desc    Sync Bank Transactions (Auto-Sync simulator)
// @route   POST /api/plaid/sync
// @access  Private
const syncBankTransactions = async (req, res, next) => {
  try {
    const { connectionId } = req.body;
    if (!connectionId) {
      res.status(400);
      throw new Error('Connection identifier is required');
    }

    const userId = req.user._id;
    let connection;

    if (global.useMockDb) {
      connection = (global.mockDb.bankConnections || []).find(c => c._id.toString() === connectionId.toString());
    } else {
      connection = await BankConnection.findById(connectionId);
    }

    if (!connection) {
      res.status(404);
      throw new Error('Bank connection not found');
    }

    if (connection.userId.toString() !== userId.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const isMock = connection.connectionType === 'indian_manual' || !connection.accessToken || connection.accessToken.startsWith('access_mock_') || useMockPlaid;
    const syncedRecords = [];

    if (isMock) {
      // Run Mock Simulator Sync
      const mockTxList = connection.connectionType === 'indian_manual' 
        ? getMockIndianTransactions()
        : getMockPlaidTransactions();

      for (const item of mockTxList) {
        if (item.type === 'expense') {
          if (global.useMockDb) {
            const mockId = Math.random().toString(36).substring(7);
            const expense = {
              _id: mockId,
              userId: userId.toString(),
              amount: item.amount,
              category: item.category,
              date: item.date,
              description: `[AUTO-SYNC] ${item.name} (${item.description})`,
              createdAt: new Date()
            };
            global.mockDb.expenses.push(expense);
            global.mockDb.transactions.push({
              _id: 't' + mockId,
              userId: userId.toString(),
              type: 'expense',
              amount: item.amount,
              category: item.category,
              date: item.date,
              description: expense.description,
              referenceId: mockId,
              createdAt: new Date()
            });
            syncedRecords.push(expense);
          } else {
            const expense = await Expense.create({
              userId,
              amount: item.amount,
              category: item.category,
              date: item.date,
              description: `[AUTO-SYNC] ${item.name} (${item.description})`
            });
            await Transaction.create({
              userId,
              type: 'expense',
              amount: item.amount,
              category: item.category,
              date: item.date,
              description: expense.description,
              referenceId: expense._id
            });
            syncedRecords.push(expense);
          }
        } else if (item.type === 'income') {
          if (global.useMockDb) {
            const mockId = Math.random().toString(36).substring(7);
            const income = {
              _id: mockId,
              userId: userId.toString(),
              amount: item.amount,
              category: item.category,
              date: item.date,
              description: `[AUTO-SYNC] ${item.name} (${item.description})`,
              createdAt: new Date()
            };
            global.mockDb.incomes.push(income);
            global.mockDb.transactions.push({
              _id: 't' + mockId,
              userId: userId.toString(),
              type: 'income',
              amount: item.amount,
              category: item.category,
              date: item.date,
              description: income.description,
              referenceId: mockId,
              createdAt: new Date()
            });
            syncedRecords.push(income);
          } else {
            const income = await Income.create({
              userId,
              amount: item.amount,
              category: item.category,
              date: item.date,
              description: `[AUTO-SYNC] ${item.name} (${item.description})`
            });
            await Transaction.create({
              userId,
              type: 'income',
              amount: item.amount,
              category: item.category,
              date: item.date,
              description: income.description,
              referenceId: income._id
            });
            syncedRecords.push(income);
          }
        }
      }

      connection.lastSynced = new Date();
      if (!global.useMockDb) {
        await BankConnection.findByIdAndUpdate(connectionId, { lastSynced: new Date() });
      }

      return res.status(200).json({ success: true, count: syncedRecords.length, data: syncedRecords });
    }

    // Real Plaid API sync
    const syncResponse = await client.transactionsSync({
      access_token: connection.accessToken,
    });

    const added = syncResponse.data.added || [];

    for (const plaidTx of added) {
      const amount = Math.abs(plaidTx.amount);
      const isOutflow = plaidTx.amount > 0;

      let category = 'Others';
      const plaidCategories = plaidTx.category || [];
      if (plaidCategories.some(c => c.toLowerCase().includes('food') || c.toLowerCase().includes('dining'))) {
        category = 'Food';
      } else if (plaidCategories.some(c => c.toLowerCase().includes('travel') || c.toLowerCase().includes('taxi') || c.toLowerCase().includes('transport'))) {
        category = 'Transport';
      } else if (plaidCategories.some(c => c.toLowerCase().includes('education') || c.toLowerCase().includes('tuition'))) {
        category = 'Education';
      } else if (plaidCategories.some(c => c.toLowerCase().includes('shops') || c.toLowerCase().includes('clothing'))) {
        category = 'Shopping';
      } else if (plaidCategories.some(c => c.toLowerCase().includes('entertainment') || c.toLowerCase().includes('movie') || c.toLowerCase().includes('recreation'))) {
        category = 'Entertainment';
      } else if (plaidCategories.some(c => c.toLowerCase().includes('bill') || c.toLowerCase().includes('utility') || c.toLowerCase().includes('service'))) {
        category = 'Bills';
      }

      if (isOutflow) {
        const expense = await Expense.create({
          userId,
          amount,
          category,
          date: new Date(plaidTx.date),
          description: `[AUTO-SYNC] ${plaidTx.name}`
        });
        await Transaction.create({
          userId,
          type: 'expense',
          amount,
          category,
          date: new Date(plaidTx.date),
          description: expense.description,
          referenceId: expense._id
        });
        syncedRecords.push(expense);
      } else {
        let incCategory = 'Other Income';
        if (plaidCategories.some(c => c.toLowerCase().includes('payroll') || c.toLowerCase().includes('salary'))) {
          incCategory = 'Salary';
        } else if (plaidCategories.some(c => c.toLowerCase().includes('interest') || c.toLowerCase().includes('investment'))) {
          incCategory = 'Investments';
        }

        const income = await Income.create({
          userId,
          amount,
          category: incCategory,
          date: new Date(plaidTx.date),
          description: `[AUTO-SYNC] ${plaidTx.name}`
        });
        await Transaction.create({
          userId,
          type: 'income',
          amount,
          category: incCategory,
          date: new Date(plaidTx.date),
          description: income.description,
          referenceId: income._id
        });
        syncedRecords.push(income);
      }
    }

    await BankConnection.findByIdAndUpdate(connectionId, { lastSynced: new Date() });
    res.status(200).json({ success: true, count: syncedRecords.length, data: syncedRecords });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLinkToken,
  exchangePublicToken,
  linkIndianAccount,
  getConnections,
  deleteConnection,
  syncBankTransactions
};
