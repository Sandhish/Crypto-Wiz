const User = require('../Models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sendOTPEmail = require('../Config/sendMail');

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email, password });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ message: 'User created successfully', token, user });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Error creating user', error });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const { password: _, ...userData } = user.toObject();

    res.status(200).json({
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Error logging in', error });
  }
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.forgotPassword = async (req, res) => {
  try {
      const { email } = req.body;
      
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({ message: 'No account found with this email' });
      }

      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();

      await sendOTPEmail(email, otp);

      res.json({ 
          success: true,
          message: 'Password reset OTP has been sent to your email' 
      });
  } catch (error) {
      console.error('Error in forgotPassword:', error);
      res.status(500).json({ 
          success: false,
          message: 'Failed to process password reset request' 
      });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
      const { email, otp } = req.body;
      
      const user = await User.findOne({
          email,
          otp,
          otpExpiry: { $gt: Date.now() }
      });

      if (!user) {
          return res.status(400).json({ 
              success: false,
              message: 'Invalid or expired OTP' 
          });
      }

      res.json({ 
          success: true,
          message: 'OTP verified successfully' 
      });
  } catch (error) {
      console.error('Error in verifyOTP:', error);
      res.status(500).json({ 
          success: false,
          message: 'Failed to verify OTP' 
      });
  }
};

exports.resetPassword = async (req, res) => {
  try {
      const { email, otp, newPassword } = req.body;
      
      const user = await User.findOne({
          email,
          otp,
          otpExpiry: { $gt: Date.now() }
      });

      if (!user) {
          return res.status(400).json({ 
              success: false,
              message: 'Invalid or expired OTP' 
          });
      }

      user.password = newPassword;
      user.otp = null;
      user.otpExpiry = null;
      
      await user.save();

      res.json({ 
          success: true,
          message: 'Password has been reset successfully' 
      });
  } catch (error) {
      console.error('Error in resetPassword:', error);
      res.status(500).json({ 
          success: false,
          message: 'Failed to reset password' 
      });
  }
};
