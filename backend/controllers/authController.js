const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const sendEmail = require('../utils/sendEmail');

// Helper function to generate JWT
const generateToken = (id, rememberMe = false) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'jwt_secret_dev_key', {
    expiresIn: rememberMe ? '30d' : '1d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400);
      throw new Error('Please enter all fields');
    }

    // Strong password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      res.status(400);
      throw new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
    }

    if (global.useMockDb) {
      const userExists = global.mockDb.users.find(u => u.email === email || u.username === username);
      if (userExists) {
        res.status(400);
        throw new Error('User already exists with this email or username');
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const mockId = Math.random().toString(36).substring(7);
      const profilePic = `https://api.dicebear.com/7.x/bottts/svg?seed=${username || mockId}`;

      const user = {
        _id: mockId,
        username,
        email,
        password: hashedPassword,
        profilePic,
        currency: 'INR',
        createdAt: new Date()
      };

      global.mockDb.users.push(user);

      res.status(201).json({
        success: true,
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        currency: user.currency,
        token: generateToken(user._id)
      });
      return;
    }

    // MongoDB connection logic
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email or username');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const profilePic = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      profilePic
    });

    if (user) {
      await ActivityLog.create({
        userId: user._id,
        action: 'REGISTER',
        ipAddress: req.ip || req.connection.remoteAddress
      });

      // Generate email verification token
      const verificationToken = crypto.randomBytes(20).toString('hex');
      user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
      await user.save({ validateBeforeSave: false });

      // Send verification email
      const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verifyemail/${verificationToken}`;
      const message = `You are receiving this email because you (or someone else) registered an account at FinBot AI. \n\n Please make a GET request to: \n\n ${verifyUrl}`;
      try {
        await sendEmail({
          email: user.email,
          subject: 'Email Verification - FinBot AI',
          message
        });
      } catch (err) {
        console.error('Email verification sending failed', err);
      }

      res.status(201).json({
        success: true,
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        currency: user.currency,
        isEmailVerified: user.isEmailVerified,
        token: generateToken(user._id, false)
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { emailOrUsername, password, rememberMe } = req.body;

    if (!emailOrUsername || !password) {
      res.status(400);
      throw new Error('Please enter all fields');
    }

    if (global.useMockDb) {
      const user = global.mockDb.users.find(u => u.email === emailOrUsername || u.username === emailOrUsername);

      if (user && bcrypt.compareSync(password, user.password)) {
        res.json({
          success: true,
          _id: user._id,
          username: user.username,
          email: user.email,
          profilePic: user.profilePic,
          currency: user.currency,
          token: generateToken(user._id, rememberMe)
        });
      } else {
        res.status(401);
        throw new Error('Invalid credentials');
      }
      return;
    }

    // MongoDB connection logic
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    }).select('+password +loginAttempts +lockUntil +isEmailVerified');

    if (!user) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      res.status(403);
      const waitMinutes = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      throw new Error(`Account temporarily locked due to multiple failed login attempts. Try again in ${waitMinutes} minutes.`);
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      // Reset lockout fields on success
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();

      await ActivityLog.create({
        userId: user._id,
        action: 'LOGIN_SUCCESS',
        ipAddress: req.ip || req.connection.remoteAddress,
        deviceInfo: req.headers['user-agent']
      });

      res.json({
        success: true,
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        currency: user.currency,
        isEmailVerified: user.isEmailVerified,
        token: generateToken(user._id, rememberMe)
      });
    } else {
      // Increment login attempts on failure
      user.loginAttempts += 1;

      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes lock
      }
      await user.save();

      await ActivityLog.create({
        userId: user._id,
        action: 'LOGIN_FAILED',
        ipAddress: req.ip || req.connection.remoteAddress
      });

      if (user.loginAttempts >= 5) {
        res.status(403);
        throw new Error('Account locked due to 5 failed attempts. Please try again in 15 minutes.');
      } else {
        res.status(401);
        throw new Error(`Invalid credentials. You have ${5 - user.loginAttempts} attempts left.`);
      }
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    if (global.useMockDb) {
      const user = global.mockDb.users.find(u => u._id.toString() === req.user._id.toString());
      if (!user) {
        res.status(404);
        throw new Error('User not found');
      }
      const { password, ...userWithoutPassword } = user;
      res.status(200).json({ success: true, data: userWithoutPassword });
      return;
    }

    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    if (global.useMockDb) {
      const userIdx = global.mockDb.users.findIndex(u => u._id.toString() === req.user._id.toString());

      if (userIdx === -1) {
        res.status(404);
        throw new Error('User not found');
      }

      const user = global.mockDb.users[userIdx];
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
      user.currency = req.body.currency || user.currency;
      user.profilePic = req.body.profilePic || user.profilePic;

      if (req.body.password) {
        user.password = bcrypt.hashSync(req.body.password, 10);
      }

      global.mockDb.users[userIdx] = user;

      res.status(200).json({
        success: true,
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        currency: user.currency,
        token: generateToken(user._id)
      });
      return;
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.currency = req.body.currency || user.currency;
    user.profilePic = req.body.profilePic || user.profilePic;

    if (req.body.password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(req.body.password)) {
        res.status(400);
        throw new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }
    user.profilePic = req.body.profilePic || user.profilePic;
    user.currency = req.body.currency || user.currency;

    const updatedUser = await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: req.body.password ? 'PASSWORD_CHANGE' : 'PROFILE_UPDATE',
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({
      success: true,
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      profilePic: updatedUser.profilePic,
      currency: updatedUser.currency,
      token: generateToken(updatedUser._id)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Email
// @route   GET /api/auth/verifyemail/:token
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Email verified successfully. You can now login.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Resend Verification Email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    const verificationToken = crypto.randomBytes(20).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verifyemail/${verificationToken}`;
    const message = `Please verify your email by clicking this link: \n\n ${verifyUrl}`;

    await sendEmail({
      email: user.email,
      subject: 'Email Verification - FinBot AI',
      message
    });

    res.status(200).json({ success: true, message: 'Verification email sent' });
  } catch (err) {
    next(err);
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    let user;

    if (global.useMockDb) {
      user = global.mockDb.users.find(u => u.email === req.body.email);
    } else {
      user = await User.findOne({ email: req.body.email });
    }

    if (!user) {
      res.status(404);
      throw new Error('There is no user with that email');
    }

    let resetToken;

    if (global.useMockDb) {
      resetToken = crypto.randomBytes(20).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    } else {
      resetToken = user.getResetPasswordToken();
      await user.save({ validateBeforeSave: false });
    }

    // Create reset url
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    const message = `
      <h1>You requested a password reset</h1>
      <p>Please go to this link to reset your password:</p>
      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Token',
        message
      });

      res.status(200).json({ success: true, data: 'Email sent' });
    } catch (error) {
      if (!global.useMockDb) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
      }

      res.status(500);
      throw new Error('Email could not be sent');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    let user;

    if (global.useMockDb) {
      user = global.mockDb.users.find(
        u => u.resetPasswordToken === resetPasswordToken && u.resetPasswordExpire > Date.now()
      );
    } else {
      user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
      });
    }

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired token');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    if (global.useMockDb) {
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
    } else {
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

// ✅ FIXED: Added verifyEmail and resendVerificationEmail to exports
module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail
};