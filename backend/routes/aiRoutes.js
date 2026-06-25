const express = require('express');
const { getAIReport, chatWithBot } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/report', protect, getAIReport);
router.post('/chat', protect, chatWithBot);

module.exports = router;
