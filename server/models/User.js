const mongoose = require("mongoose");

/**
 * User model — supports both local (username/password) and Google accounts.
 *
 * passwordHash is only required when authProvider is "local".
 * googleId uses a sparse unique index so multiple documents can have null/missing
 * googleId without violating uniqueness.
 */
const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
  },
  registerNumber: {
    type: String,
    required: [true, "Register number is required"],
    unique: true,
    trim: true,
  },
  collegeName: {
    type: String,
    required: [true, "College name is required"],
    trim: true,
  },
  // Only set for "local" accounts — Google accounts have no password.
  passwordHash: {
    type: String,
    required: function () {
      return this.authProvider === "local";
    },
  },
  // Only set for "google" accounts — sparse so null values are not indexed.
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
