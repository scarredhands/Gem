const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const JWT_secret= "pQjcbTkfMDo3ub4t73hrjObXsd2/Nncj1kRoTsdFD7M";

// Register User
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  console.log("--- REGISTER ROUTE HIT ---"); // Add this
  console.log("Request Body:", req.body);    // And this

  try {
    // Defensive check for password
    if (!password || typeof password !== 'string') {
        console.error("Password is missing or not a string:", password);
        return res.status(400).json({ error: "Password is required and must be a string." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    console.log("Attempting to save new user:", { username, email }); // Log before save
    const savedUser = await newUser.save();
    console.log("User saved successfully:", savedUser._id); // Log after save
    res.status(201).json(savedUser);
  } catch (err) {
    console.error("!!! ERROR IN REGISTER ROUTE !!!:", err); // Log the full error object
    console.error("Error Name:", err.name);                 // Log error name (e.g., ValidationError, MongoError)
    console.error("Error Message:", err.message);           // Log specific message
    console.error("Error Stack:", err.stack);               // Log the stack trace
    
    // Check for specific Mongoose validation or duplicate key errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: "Validation Error", details: err.errors });
    }
    if (err.code === 11000) { // MongoDB duplicate key error code
      return res.status(409).json({ error: "Duplicate key error", message: "Email or username already exists." });
    }

    res.status(500).json({ error: "Server error during registration.", details: err.message });
  }
});

// // Register User
// router.post('/register', async (req, res) => {
//   const { username, email, password } = req.body;
//    console.log("Request Body:", req.body); 
//   try {
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const newUser = new User({
//       username,
//       email,
//       password: hashedPassword,
//     });

//     const savedUser = await newUser.save();
//     res.status(201).json(savedUser);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id },JWT_secret, {
      expiresIn: '1h',
    });

    res.json({ token, userId: user._id, });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
