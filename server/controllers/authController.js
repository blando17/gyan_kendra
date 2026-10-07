const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Activity = require("../models/Activity");
const { asyncHandler, badRequest } = require("../utils/errors");

function signToken(userId) {
  return jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// ========================================
// SIGNUP
// ========================================

const signUp = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw badRequest("Username, email and password are required!");
  }

  if (String(password).length < 6) {
    throw badRequest("Password must be at least 6 characters!");
  }

  const existing = await User.findOne({ email: String(email).toLowerCase() });

  if (existing) {
    throw badRequest("User already exists!");
  }

  // The model hashes the password before it is written.
  const user = await User.create({ username, email, password });

  await Activity.create({
    userId: user._id,
    text: "Welcome to GyanKendra",
    type: "info",
  });

  res.status(201).json({
    message: "User created successfully!",
    token: signToken(user._id),
    user: user.toPublic(),
  });
});

// ========================================
// LOGIN
// ========================================

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw badRequest("Email and password are required!");
  }

  // password is select:false on the schema, so ask for it explicitly.
  const user = await User.findOne({
    email: String(email).toLowerCase(),
  }).select("+password");

  // The same message either way, so this cannot be used to discover emails.
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid credentials!" });
  }

  res.json({
    message: "Login successful!",
    token: signToken(user._id),
    user: user.toPublic(),
  });
});

// ========================================
// CURRENT USER
// ========================================

const getMe = asyncHandler(async (req, res) => {
  // The id comes from the verified token only.
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found!" });
  }

  res.json({ user: user.toPublic() });
});

// ========================================
// UPDATE ACCOUNT
// ========================================

const updateProfile = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const user = await User.findById(req.user.id).select("+password");

  if (!user) {
    return res.status(404).json({ message: "User not found!" });
  }

  if (username) user.username = username;

  if (email) user.email = email;

  if (password) {
    if (String(password).length < 6) {
      throw badRequest("Password must be at least 6 characters!");
    }

    user.password = password;
  }

  await user.save();

  res.json({ message: "User updated successfully!", user: user.toPublic() });
});

module.exports = { signUp, login, getMe, updateProfile };
