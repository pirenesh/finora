const express = require('express');
const { getSecurityDashboard } = require('../controllers/securityController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard', protect, getSecurityDashboard);

module.exports = router;
