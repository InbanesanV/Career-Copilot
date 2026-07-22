const jwt = require("jsonwebtoken");

/**
 * Generate a signed JWT for the given user.
 * Payload: { userId, userName }
 * Expiry: 7 days
 *
 * @param {{ _id: any, userName: string }} user
 * @returns {string} signed JWT
 */
function generateToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), userName: user.userName },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * Express middleware — requires a valid JWT in the Authorization header.
 *
 * Expects:  Authorization: Bearer <token>
 *
 * On success: attaches req.userId (string) and req.userName (string), calls next().
 * On failure: returns 401 with a user-friendly error message.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"] || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Please log in to continue." });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({ error: "Please log in to continue." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userName = decoded.userName;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ error: "Session expired. Please log in again." });
  }
}

module.exports = { generateToken, requireAuth };
