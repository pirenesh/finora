// Input Validation Helpers for REST routes

const validateRegistration = (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
  }

  const emailRegex = /.+\@.+\..+/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || typeof emailOrUsername !== 'string' || !emailOrUsername.trim()) {
    return res.status(400).json({ success: false, message: 'Please enter your email or username' });
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({ success: false, message: 'Please enter your password' });
  }

  next();
};

const validateTransaction = (req, res, next) => {
  const { amount, category, date } = req.body;

  if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
  }

  if (!category || typeof category !== 'string' || !category.trim()) {
    return res.status(400).json({ success: false, message: 'Category is required' });
  }

  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({ success: false, message: 'Please provide a valid date' });
  }

  next();
};

const validateBudget = (req, res, next) => {
  const { category, limit, month } = req.body;

  if (limit === undefined || typeof limit !== 'number' || limit < 0) {
    return res.status(400).json({ success: false, message: 'Budget limit must be a positive number' });
  }

  if (!category || typeof category !== 'string' || !category.trim()) {
    return res.status(400).json({ success: false, message: 'Category is required' });
  }

  const monthRegex = /^\d{4}-\d{2}$/;
  if (!month || !monthRegex.test(month)) {
    return res.status(400).json({ success: false, message: 'Month must be in YYYY-MM format' });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateTransaction,
  validateBudget
};
