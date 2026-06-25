const express = require('express');
const { getBankLoans } = require('../controllers/bankLoanController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getBankLoans);

module.exports = router;
