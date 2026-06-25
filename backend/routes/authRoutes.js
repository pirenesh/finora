const express = require('express');
const { registerUser, loginUser, getMe, updateProfile, forgotPassword, resetPassword, verifyEmail, resendVerificationEmail } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/verifyemail/:token', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

module.exports = router;
