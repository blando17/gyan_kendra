const jwt = require("jsonwebtoken");

// Reads the bearer token, verifies it, and puts the user id on the request.
// Controllers take the id from here and never from the body or the URL.
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Access token required!" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required!" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token!" });
  }
}

module.exports = authenticateToken;
