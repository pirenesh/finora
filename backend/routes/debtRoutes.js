const express = require('express');
const { getDebts, createDebt, recordRepayment, deleteDebt } = require('../controllers/debtController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getDebts)
  .post(protect, createDebt);

router.route('/:id')
  .delete(protect, deleteDebt);

router.route('/:id/repay')
  .post(protect, recordRepayment);

module.exports = router;
