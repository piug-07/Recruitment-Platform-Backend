const router = require("express").Router();
const User = require('../../../models/User.js');
const { errorHandler } = require('../../../utils/error.js')
const bcryptjs = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require('validator');
const tokenBlacklist = new Set();


router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password, admissionNumber, year, Domain } = req.body;

    // Validate email 
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user with the same email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = bcryptjs.hashSync(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      admissionNumber,
      year,
      Domain
    });

    await newUser.save();

    res.status(201).json({ success: true, message: 'User created successfully!' });
  } catch (error) {
    next(error);
  }
});


// Google auth
router.post("/google", async (req, res, next) => {
  const { name, email } = req.body;
  try {
    const validUser = await User.findOne({ email });

    if (validUser) {
      const token = jwt.sign({ _id: validUser._id }, process.env.JWT_SECRETUser, {
        expiresIn: "3d"
      });
      const { password: pass, ...rest } = validUser._doc;
      res
        .header('Authorization', 'Bearer ' + token)
        .status(200)
        .json(rest);
    } else {
      const generatedPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);
      const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
      });
      await newUser.save();
      const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRETUser, {
        expiresIn: "3d"
      });
      const { password: pass, ...rest } = newUser._doc;

      res.header('Authorization', 'Bearer ' + token)
      // Expose the 'Authorization' header to the client
      res.header('Access-Control-Expose-Headers', 'Authorization');
      res.status(200)
        .json(rest);
    }
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email using 
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user with the given email exists
    const validUser = await User.findOne({ email });

    if (!validUser) {
      return next(errorHandler(404, 'User not found!'));
    }

    // Check if the password is valid
    const validPassword = bcryptjs.compareSync(password, validUser.password);

    if (!validPassword) {
      return next(errorHandler(401, 'Wrong credentials!'));
    }

    // Generate JWT token for authentication
    const token = jwt.sign({ _id: validUser._id }, process.env.JWT_SECRETUser, {
      expiresIn: "3d"
    });

    // Remove password from the user data 
    const { password: _, ...userData } = validUser._doc;


    res.header('Authorization', 'Bearer ' + token)
    // Expose the 'Authorization' header to the client
    res.header('Access-Control-Expose-Headers', 'Authorization');
    res.status(200)
      .json(userData);

  } catch (error) {
    next(error);
  }
});


router.post("/logout", (req, res) => {
  try {
    const authHeader = req.headers["authorization"];

    // Extract the token from the Authorization header
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(400).json({ success: false, msg: 'No token provided' });
    }

    // Add the token to the blacklist
    tokenBlacklist.add(token);

    res.status(200).json({ success: true, msg: 'You have been logged out' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'Error during logout' });
  }
});


module.exports = router;