// server.js
const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const upload = require('./config/multerconfig'); // multer config
require('dotenv').config(); // optional: load .env

// Models (no mongoose.connect in models; connect here)
const userModel = require('./models/user');
const postModel = require('./models/post');

// ---------- Config ----------
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/miniproject';
const JWT_SECRET = process.env.JWT_SECRET || 'secure'; // replace in production

// ---------- DB connect ----------
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err.message));

// ---------- Middlewares ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS - allow Vite dev server origin and credentials (cookies)
app.use(cors({
  origin: 'http://localhost:5173', // <-- Vite dev server URL
  credentials: true
}));

// Serve static files (images, etc.). Frontend will request /public/...
app.use('/public', express.static(path.join(__dirname, 'public')));

// Helpers for uniform JSON responses
function sendOK(res, data = {}, message = 'OK') {
  return res.json({ success: true, message, data });
}
function sendError(res, status = 400, message = 'Error', data = {}) {
  return res.status(status).json({ success: false, message, data });
}

// ---------- Auth middleware ----------
function isLoggedin(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) return sendError(res, 401, 'Not authenticated');
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { email, userid, iat, exp }
    return next();
  } catch (err) {
    return sendError(res, 401, 'Invalid or expired token');
  }
}

// ---------- API routes (prefix with /api) ----------

// GET /api/profile -> returns user and populated posts
app.get('/api/profile', isLoggedin, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email }).populate({
      path: 'posts',
      options: { sort: { createdAt: -1 } }
    });
    if (!user) return sendError(res, 404, 'User not found');
    const userObj = user.toObject();
    delete userObj.password;
    return sendOK(res, { user: userObj }, 'Profile fetched');
  } catch (err) {
    return sendError(res, 500, 'Server error', { error: err.message });
  }
});

// POST /api/register
app.post('/api/register', async (req, res) => {
  try {
    const { username, name, age, email, password } = req.body;
    if (!email || !password) return sendError(res, 400, 'Email and password required');
    const existing = await userModel.findOne({ email });
    if (existing) return sendError(res, 400, 'User already exists');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await userModel.create({ username, name, age, email, password: hash });
    const token = jwt.sign({ email, userid: user._id }, JWT_SECRET, { expiresIn: '7d' });
    // cookie options: httpOnly & sameSite lax are good defaults for dev
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    const safeUser = user.toObject();
    delete safeUser.password;
    return sendOK(res, { user: safeUser }, 'Registered');
  } catch (err) {
    return sendError(res, 500, 'Server error', { error: err.message });
  }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendError(res, 400, 'Email and password required');
    const user = await userModel.findOne({ email });
    if (!user) return sendError(res, 400, 'Invalid credentials');
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return sendError(res, 400, 'Invalid credentials');
    const token = jwt.sign({ email, userid: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    const safeUser = user.toObject();
    delete safeUser.password;
    return sendOK(res, { user: safeUser }, 'Logged in');
  } catch (err) {
    return sendError(res, 500, 'Server error', { error: err.message });
  }
});

// POST /api/logout
app.post('/api/logout', (req, res) => {
  res.cookie('token', '', { maxAge: 0 });
  return sendOK(res, {}, 'Logged out');
});

// POST /api/post -> create a post
app.post('/api/post', isLoggedin, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return sendError(res, 400, 'Content required');
    const user = await userModel.findOne({ email: req.user.email });
    if (!user) return sendError(res, 404, 'User not found');
    const post = await postModel.create({ user: user._id, content });
    user.posts.push(post._id);
    await user.save();
    return sendOK(res, { post }, 'Post created');
  } catch (err) {
    return sendError(res, 500, 'Server error', { error: err.message });
  }
});

// POST /api/like/:id -> toggle like
app.post('/api/like/:id', isLoggedin, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) return sendError(res, 404, 'Post not found');
    const idx = post.likes.findIndex(id => id.toString() === req.user.userid);
    if (idx === -1) post.likes.push(req.user.userid);
    else post.likes.splice(idx, 1);
    await post.save();
    return sendOK(res, { post }, 'Toggled like');
  } catch (err) {
    return sendError(res, 500, 'Server error', { error: err.message });
  }
});

// GET /api/post/:id -> fetch single post
app.get('/api/post/:id', isLoggedin, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id).populate('user');
    if (!post) return sendError(res, 404, 'Post not found');
    return sendOK(res, { post }, 'Post fetched');
  } catch (err) {
    return sendError(res, 500, 'Server error', { error: err.message });
  }
});

// PUT /api/update/:id -> update post (only owner)
app.put('/api/update/:id', isLoggedin, async (req, res) => {
  try {
    const { content } = req.body;
    const post = await postModel.findById(req.params.id);
    if (!post) return sendError(res, 404, 'Post not found');
    if (post.user.toString() !== req.user.userid) return sendError(res, 403, 'Not allowed');
    if (typeof content === 'string') post.content = content;
    await post.save();
    return sendOK(res, { post }, 'Post updated');
  } catch (err) {
    return sendError(res, 500, 'Server error', { error: err.message });
  }
});

// POST /api/upload -> upload profile pic (multipart/form-data)
app.post('/api/upload', isLoggedin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, 'File required');
    const user = await userModel.findOne({ email: req.user.email });
    if (!user) return sendError(res, 404, 'User not found');
    user.profilepic = req.file.filename;
    await user.save();
    return sendOK(res, { filename: req.file.filename, user }, 'Uploaded');
  } catch (err) {
    return sendError(res, 500, 'Server error', { error: err.message });
  }
});

// Fallback route for API root
app.get('/api', (req, res) => sendOK(res, {}, 'API root'));

// Start server
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
