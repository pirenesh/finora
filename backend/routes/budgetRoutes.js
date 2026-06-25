const express = require('express');
const { getBudgets, setBudget, deleteBudget } = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getBudgets)
  .post(protect, setBudget);

router.route('/:id')
  .delete(protect, deleteBudget);

module.exports = router;
