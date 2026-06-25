const express = require('express');
const { getMarketInsights } = require('../controllers/marketController');

const router = express.Router();

// Get market insights (public route)
router.get('/insights', getMarketInsights);

module.exports = router;
