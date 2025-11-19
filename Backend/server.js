// server.js
const express = require('express');
const app = express();
const port = 3000;
const path = require("path");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const upload = require("./config/multerconfig");

// Import models (these files don't call mongoose.connect, server does)
const userModel = require('./models/user');
const postModel = require('./models/post');

const mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/miniproject", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/public', express.static(path.join(__dirname, "public")));

// Optional: allow CORS from your dev server (if front-end runs on different port)
// If you need it, uncomment and adjust origin.
const cors = require('cors');
app.use(cors({
  origin: true,
  credentials: true
}));

// --- Helper: send structured JSON responses ---
function sendOK(res, data = {}, message = "OK") {
  return res.json({ success: true, message, data });
}
function sendError(res, status = 400, message = "Error", data = {}) {
  return res.status(status).json({ success: false, message, data });
}

// --- Middleware: isLoggedin ---
function isLoggedin(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) return sendError(res, 401, "Not authenticated");
    const data = jwt.verify(token, "secure");
    req.user = data;
    next();
  } catch (err) {
    return sendError(res, 401, "Invalid or expired token");
  }
}

/*
  API routes (prefixed with /api)
*/

// GET profile (returns user + populated posts)
app.get("/api/profile", isLoggedin, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email }).populate({
      path: "posts",
      options: { sort: { date: -1 } }
    });
    if (!user) return sendError(res, 404, "User not found");
    // avoid leaking password
    const userObj = user.toObject();
    delete userObj.password;
    return sendOK(res, { user: userObj }, "Profile fetched");
  } catch (e) {
    return sendError(res, 500, "Server error", { error: e.message });
  }
});

// POST create a new post
app.post("/api/post", isLoggedin, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });
    if (!user) return sendError(res, 404, "User not found");
    const { content } = req.body;
    if (!content) return sendError(res, 400, "Content required");
    const post = await postModel.create({
      user: user._id,
      content,
    });
    user.posts.push(post._id);
    await user.save();
    return sendOK(res, { post }, "Post created");
  } catch (e) {
    return sendError(res, 500, "Server error", { error: e.message });
  }
});

// POST like/unlike
app.post("/api/like/:id", isLoggedin, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) return sendError(res, 404, "Post not found");
    const idx = post.likes.findIndex(id => id.toString() === req.user.userid);
    if (idx === -1) post.likes.push(req.user.userid);
    else post.likes.splice(idx, 1);
    await post.save();
    return sendOK(res, { post }, "Toggled like");
  } catch (e) {
    return sendError(res, 500, "Server error", { error: e.message });
  }
});

// GET a single post
app.get("/api/post/:id", isLoggedin, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id).populate('user');
    if (!post) return sendError(res, 404, "Post not found");
    return sendOK(res, { post }, "Post fetched");
  } catch (e) {
    return sendError(res, 500, "Server error", { error: e.message });
  }
});

// PUT update post
app.put("/api/update/:id", isLoggedin, async (req, res) => {
  try {
    const { content } = req.body;
    const post = await postModel.findById(req.params.id);
    if (!post) return sendError(res, 404, "Post not found");
    // optional: check ownership
    if (post.user.toString() !== req.user.userid) {
      return sendError(res, 403, "Not allowed");
    }
    post.content = content ?? post.content;
    await post.save();
    return sendOK(res, { post }, "Post updated");
  } catch (e) {
    return sendError(res, 500, "Server error", { error: e.message });
  }
});

// POST upload profile pic
app.post("/api/upload", isLoggedin, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, "File required");
    const user = await userModel.findOne({ email: req.user.email });
    if (!user) return sendError(res, 404, "User not found");
    user.profilepic = req.file.filename;
    await user.save();
    return sendOK(res, { filename: req.file.filename, user }, "Uploaded");
  } catch (e) {
    return sendError(res, 500, "Server error", { error: e.message });
  }
});

// POST register
app.post("/api/register", async (req, res) => {
  try {
    const { username, name, age, email, password } = req.body;
    const existing = await userModel.findOne({ email });
    if (existing) return sendError(res, 400, "User already exists");
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await userModel.create({
      username, name, age, email, password: hash
    });
    const token = jwt.sign({ email, userid: user._id }, "secure", { expiresIn: '7d' });
    res.cookie("token", token, { httpOnly: true, sameSite: 'lax' });
    return sendOK(res, { user }, "Registered");
  } catch (e) {
    return sendError(res, 500, "Server error", { error: e.message });
  }
});

// POST login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) return sendError(res, 400, "Invalid credentials");
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return sendError(res, 400, "Invalid credentials");
    const token = jwt.sign({ email, userid: user._id }, "secure", { expiresIn: '7d' });
    res.cookie("token", token, { httpOnly: true, sameSite: 'lax' });
    return sendOK(res, { user }, "Logged in");
  } catch (e) {
    return sendError(res, 500, "Server error", { error: e.message });
  }
});

// POST logout
app.post("/api/logout", (req, res) => {
  res.cookie("token", "", { maxAge: 0 });
  return sendOK(res, {}, "Logged out");
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
