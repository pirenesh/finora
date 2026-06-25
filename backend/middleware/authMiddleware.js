const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret_dev_key');

      // Fetch user context
      if (global.useMockDb) {
        const mockUser = global.mockDb.users.find(u => u._id.toString() === decoded.id);
        if (!mockUser) {
          return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
        }
        // Exclude password field from the attached request context
        const { password, ...userWithoutPassword } = mockUser;
        req.user = userWithoutPassword;
      } else {
        req.user = await User.findById(decoded.id).select('-password');
      }
      
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
