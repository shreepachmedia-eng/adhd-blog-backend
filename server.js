const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const marked = require('marked');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

// Create necessary directories
const dirs = ['./data', './uploads', './public'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Initialize data files
const DATA_FILES = {
  posts: './data/posts.json',
  pages: './data/pages.json',
  settings: './data/settings.json',
  users: './data/users.json'
};

Object.entries(DATA_FILES).forEach(([key, file]) => {
  if (!fs.existsSync(file)) {
    const initialData = key === 'users' 
      ? [{ id: '1', email: 'admin@example.com', password: bcrypt.hashSync('admin123', 10), role: 'admin' }]
      : key === 'settings'
      ? { siteName: 'My Blog', siteUrl: 'https://yoursite.com', adminEmail: 'admin@example.com' }
      : [];
    fs.writeFileSync(file, JSON.stringify(initialData, null, 2));
  }
});

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only image files are allowed!'));
  }
});

// Helper functions
const readData = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeData = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

const isAuth = (req, res, next) => {
  if (req.session.userId) return next();
  res.status(401).json({ error: 'Unauthorized' });
};

// ==================== AUTH ROUTES ====================

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = readData(DATA_FILES.users);
    const user = users.find(u => u.email === email);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.userId = user.id;
    req.session.email = user.email;
    res.json({ success: true, email: user.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
  if (req.session.userId) {
    return res.json({ authenticated: true, email: req.session.email });
  }
  res.json({ authenticated: false });
});

// ==================== BLOG POST ROUTES ====================

app.get('/api/posts', (req, res) => {
  try {
    const posts = readData(DATA_FILES.posts);
    const published = req.query.status === 'all' 
      ? posts 
      : posts.filter(p => p.status === 'published');
    res.json(published.sort((a, b) => new Date(b.date) - new Date(a.date)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/posts/:slug', (req, res) => {
  try {
    const posts = readData(DATA_FILES.posts);
    const post = posts.find(p => p.slug === req.params.slug);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/posts', isAuth, (req, res) => {
  try {
    const posts = readData(DATA_FILES.posts);
    const newPost = {
      id: uuidv4(),
      title: req.body.title,
      slug: req.body.slug || req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      content: req.body.content,
      excerpt: req.body.excerpt || req.body.content.substring(0, 200) + '...',
      featuredImage: req.body.featuredImage || '',
      author: req.session.email,
      date: req.body.date || new Date().toISOString(),
      status: req.body.status || 'draft',
      metaTitle: req.body.metaTitle || req.body.title,
      metaDescription: req.body.metaDescription || '',
      keywords: req.body.keywords || '',
      category: req.body.category || 'Uncategorized',
      tags: req.body.tags || []
    };
    posts.push(newPost);
    writeData(DATA_FILES.posts, posts);
    res.json(newPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/posts/:id', isAuth, (req, res) => {
  try {
    const posts = readData(DATA_FILES.posts);
    const index = posts.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Post not found' });
    
    posts[index] = { ...posts[index], ...req.body, updatedAt: new Date().toISOString() };
    writeData(DATA_FILES.posts, posts);
    res.json(posts[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/posts/:id', isAuth, (req, res) => {
  try {
    const posts = readData(DATA_FILES.posts);
    const filtered = posts.filter(p => p.id !== req.params.id);
    writeData(DATA_FILES.posts, filtered);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PAGE ROUTES ====================

app.get('/api/pages', (req, res) => {
  try {
    const pages = readData(DATA_FILES.pages);
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/pages/:slug', (req, res) => {
  try {
    const pages = readData(DATA_FILES.pages);
    const page = pages.find(p => p.slug === req.params.slug);
    if (!page) return res.status(404).json({ error: 'Page not found' });
    res.json(page);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/pages', isAuth, (req, res) => {
  try {
    const pages = readData(DATA_FILES.pages);
    const newPage = {
      id: uuidv4(),
      title: req.body.title,
      slug: req.body.slug || req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      content: req.body.content,
      metaTitle: req.body.metaTitle || req.body.title,
      metaDescription: req.body.metaDescription || '',
      status: req.body.status || 'draft',
      createdAt: new Date().toISOString()
    };
    pages.push(newPage);
    writeData(DATA_FILES.pages, pages);
    res.json(newPage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/pages/:id', isAuth, (req, res) => {
  try {
    const pages = readData(DATA_FILES.pages);
    const index = pages.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Page not found' });
    
    pages[index] = { ...pages[index], ...req.body, updatedAt: new Date().toISOString() };
    writeData(DATA_FILES.pages, pages);
    res.json(pages[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/pages/:id', isAuth, (req, res) => {
  try {
    const pages = readData(DATA_FILES.pages);
    const filtered = pages.filter(p => p.id !== req.params.id);
    writeData(DATA_FILES.pages, filtered);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== IMAGE UPLOAD ROUTES ====================

app.post('/api/upload', isAuth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl, filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/images', isAuth, (req, res) => {
  try {
    const files = fs.readdirSync('uploads/');
    const images = files.map(f => ({
      filename: f,
      url: `/uploads/${f}`,
      uploadedAt: fs.statSync(`uploads/${f}`).mtime
    })).sort((a, b) => b.uploadedAt - a.uploadedAt);
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/images/:filename', isAuth, (req, res) => {
  try {
    const filepath = path.join('uploads', req.params.filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SETTINGS ROUTES ====================

app.get('/api/settings', isAuth, (req, res) => {
  try {
    const settings = readData(DATA_FILES.settings);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings', isAuth, (req, res) => {
  try {
    writeData(DATA_FILES.settings, req.body);
    res.json(req.body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN PANEL (Serve HTML) ====================

app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`
🚀 Blog Backend Server Running!

Admin Panel: http://localhost:${PORT}/admin
API Endpoint: http://localhost:${PORT}/api

Default Login:
  Email: admin@example.com
  Password: admin123

IMPORTANT: Change default password in production!
  `);
});
