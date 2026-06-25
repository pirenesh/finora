const BankLoan = require('../models/BankLoan');

// @desc    Get all bank loans with optional filtering
// @route   GET /api/loans
// @access  Private
const getBankLoans = async (req, res, next) => {
  try {
    const { bankName, loanType, minTenure, maxRate } = req.query;
    let query = {};

    if (bankName) query.bankName = { $regex: bankName, $options: 'i' };
    if (loanType) query.loanType = { $regex: loanType, $options: 'i' };
    if (minTenure) query.maxTenureYears = { $gte: Number(minTenure) };
    
    // Note: maxRate is complex as interestRate is a string "8.40% p.a. onwards". 
    // In a real app we'd store a float baseRate.

    if (global.useMockDb) {
      if (!global.mockDb.bankLoans) {
        global.mockDb.bankLoans = require('../data/bankLoans.json');
      }
      
      let loans = global.mockDb.bankLoans;

      if (bankName) {
        const regex = new RegExp(bankName, 'i');
        loans = loans.filter(l => regex.test(l.bankName));
      }
      if (loanType) {
        const regex = new RegExp(loanType, 'i');
        loans = loans.filter(l => regex.test(l.loanType));
      }
      if (minTenure) {
        loans = loans.filter(l => l.maxTenureYears >= Number(minTenure));
      }

      return res.status(200).json({ success: true, count: loans.length, data: loans });
    }

    const loans = await BankLoan.find(query);
    res.status(200).json({ success: true, count: loans.length, data: loans });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBankLoans
};
