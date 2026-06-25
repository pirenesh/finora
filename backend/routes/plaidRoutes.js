const express = require('express');
const { 
  createLinkToken, 
  exchangePublicToken, 
  linkIndianAccount,
  getConnections, 
  deleteConnection, 
  syncBankTransactions 
} = require('../controllers/plaidController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create-link-token', protect, createLinkToken);
router.post('/exchange-public-token', protect, exchangePublicToken);
router.post('/link-indian', protect, linkIndianAccount);
router.get('/connections', protect, getConnections);
router.delete('/connections/:id', protect, deleteConnection);
router.post('/sync', protect, syncBankTransactions);

module.exports = router;
