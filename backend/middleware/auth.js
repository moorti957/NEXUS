const jwt = require('jsonwebtoken');

// ✅ Middleware function
const protect = (req, res, next) => {
  let token = req.header('x-auth-token');

  // 🔥 support Authorization Bearer token
  if (!token && req.header('Authorization')) {
    token = req.header('Authorization').replace('Bearer ', '');
  }

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded.user || decoded; // flexible

    next();
  } catch (err) {
    console.error("JWT Error:", err.message);
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

// ✅ IMPORTANT: named export (यही missing था)
module.exports = { protect };