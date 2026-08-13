const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'hiremind_super_secure_jwt_token_secret_key_12345678901234567890';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No session token provided.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Invalid authorization format.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Session token has expired or is invalid.' });
  }
};

module.exports = authMiddleware;
