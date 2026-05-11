# Blog CMS Backend - Complete Setup Guide

A simple, powerful blog CMS with admin panel, rich text editor, image uploads, and API.

## ✅ What You Get

- **Admin Panel** at `/admin` - Beautiful UI to write blogs and pages
- **Rich Text Editor** - Format text, add images, create beautiful content
- **Image Upload** - Drag & drop image uploader with gallery
- **Blog API** - REST API for fetching posts/pages
- **SEO Optimized** - Meta titles, descriptions, keywords
- **Authentication** - Secure login for admin panel

---

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
cd blog_backend
npm install
```

### 2. Start the Server

```bash
npm start
```

Server runs at **http://localhost:3000**

### 3. Login to Admin Panel

Go to **http://localhost:3000/admin**

**Default Login:**
- Email: `admin@example.com`
- Password: `admin123`

**⚠️ IMPORTANT:** Change this password immediately in production!

---

## 📁 Project Structure

```
blog_backend/
├── server.js          # Backend API server
├── package.json       # Dependencies
├── data/              # JSON database (auto-created)
│   ├── posts.json     # Blog posts
│   ├── pages.json     # Static pages
│   └── users.json     # Admin users
├── uploads/           # Uploaded images (auto-created)
└── public/
    ├── admin.html     # Admin panel UI
    └── blog.html      # Blog frontend template
```

---

## 🎨 Admin Panel Features

### Write Blog Posts
1. Go to `/admin` → Login
2. Click "Posts" → "New Post"
3. Fill in title, content, meta description
4. Upload featured image (optional)
5. Click "Save"
6. Post is published!

### Create Pages
- Same as posts, but for static pages (About, Contact, etc.)
- Access at `/pages/:slug`

### Upload Images
- Click "Images" → "Upload Image"
- Drag & drop or click to upload
- Copy image URL to use in posts
- Maximum 5MB per image

### SEO Fields
Every post/page has:
- Meta Title
- Meta Description
- Keywords
- Slug (URL)

---

## 🔗 API Endpoints

### Public Endpoints (No auth needed)

```javascript
// Get all published posts
GET /api/posts

// Get single post by slug
GET /api/posts/:slug

// Get all pages
GET /api/pages

// Get single page by slug
GET /api/pages/:slug
```

### Admin Endpoints (Auth required)

```javascript
// Create new post
POST /api/posts
Body: { title, content, slug, status, metaDescription, ... }

// Update post
PUT /api/posts/:id

// Delete post
DELETE /api/posts/:id

// Upload image
POST /api/upload
Form-data: { image: File }

// Get all images
GET /api/images
```

---

## 📝 Using the Blog Frontend

### Option 1: Integrate with Your Existing Quiz

Add this to your quiz HTML:

```html
<script>
async function loadBlogPosts() {
  const res = await fetch('http://your-backend-url.com/api/posts');
  const posts = await res.json();
  
  // Display posts however you want
  posts.forEach(post => {
    console.log(post.title, post.slug, post.excerpt);
  });
}
</script>
```

### Option 2: Use the Template

Copy `public/blog.html` and customize:
- Change colors to match your quiz
- Update header/footer
- Modify post card layout

---

## 🌐 Deployment Options

### Option A: Render.com (Recommended - FREE)

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - `SESSION_SECRET`: `your-random-secret-key`
     - `NODE_ENV`: `production`
6. Deploy!

**Your backend will be at:** `https://your-app.onrender.com`

### Option B: Railway.app (FREE)

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repo
4. Add environment variables (same as Render)
5. Deploy!

### Option C: Heroku (Paid)

```bash
heroku create your-blog-backend
git push heroku main
heroku config:set SESSION_SECRET=your-random-secret
```

### Option D: DigitalOcean/Linode ($5/month)

Standard Node.js server deployment. PM2 recommended for process management.

---

## 🔐 Security Setup (IMPORTANT!)

### 1. Change Default Password

After first login:
1. Open `data/users.json`
2. Change password hash or add new admin user
3. Restart server

### 2. Set Session Secret

In production, set environment variable:

```bash
export SESSION_SECRET=your-super-secret-random-string
```

Or in Render/Railway dashboard: `SESSION_SECRET = abc123xyz...`

### 3. Enable HTTPS

Most platforms (Render, Railway) provide HTTPS automatically.

---

## 📊 Database (JSON Files)

Data is stored in simple JSON files:

### posts.json Structure
```json
{
  "id": "uuid",
  "title": "My First Post",
  "slug": "my-first-post",
  "content": "<p>HTML content here</p>",
  "excerpt": "Short summary...",
  "featuredImage": "/uploads/image.jpg",
  "author": "admin@example.com",
  "date": "2026-05-11T10:00:00.000Z",
  "status": "published",
  "metaTitle": "SEO Title",
  "metaDescription": "SEO description",
  "keywords": "adhd, women, symptoms"
}
```

**Backup:** Just copy the `data/` and `uploads/` folders!

---

## 🎯 Integration with Your Quiz

### Embed Blog Posts in Quiz Homepage

```html
<section class="recent-posts">
  <h2>Latest ADHD Articles</h2>
  <div id="blog-posts"></div>
</section>

<script>
async function loadRecentPosts() {
  const res = await fetch('https://your-backend.onrender.com/api/posts');
  const posts = await res.json();
  const latest = posts.slice(0, 3); // Get 3 most recent
  
  document.getElementById('blog-posts').innerHTML = latest.map(post => `
    <article>
      <h3><a href="/blog/${post.slug}">${post.title}</a></h3>
      <p>${post.excerpt}</p>
    </article>
  `).join('');
}

loadRecentPosts();
</script>
```

### Add Internal Links from Quiz to Blog

In your quiz results page, add:

```html
<p>Learn more: <a href="/blog/adhd-symptoms-women">ADHD Symptoms in Women</a></p>
```

---

## 🛠️ Customization

### Change Admin Panel Colors

Edit `public/admin.html`, line 11:

```css
:root {
  --primary: #8B5CF6;  /* Change to your brand color */
  --success: #10B981;
  --danger: #EF4444;
}
```

### Add Custom Fields to Posts

Edit `server.js`, POST `/api/posts` route, add fields:

```javascript
const newPost = {
  // ... existing fields
  category: req.body.category,
  readingTime: req.body.readingTime,
  // etc
};
```

Then add input fields in `admin.html` editor form.

---

## 📱 Mobile Responsive

Both admin panel and blog frontend are fully mobile-responsive.

---

## 🐛 Troubleshooting

### "Cannot find module 'express'"
Run `npm install`

### Images not uploading
Check `uploads/` folder exists and has write permissions:
```bash
chmod 777 uploads/
```

### Can't login
Default user might not be created. Manually create `data/users.json`:
```json
[{
  "id": "1",
  "email": "admin@example.com",
  "password": "$2a$10$hash...",
  "role": "admin"
}]
```

### Posts not showing on frontend
Check if status is "published", not "draft"

---

## 📈 Next Steps After Deployment

1. **Change default password**
2. **Write your first 5-10 blog posts**
3. **Link from your quiz to blog posts**
4. **Add Google Analytics** to track traffic
5. **Submit blog sitemap to Google Search Console**

---

## 💰 Costs

- **Backend Hosting:** FREE (Render/Railway free tier)
- **Domain:** $12/year (optional)
- **Image Storage:** FREE (5MB limit per image, stored on server)
- **Total:** $0-12/year

---

## ✅ Checklist Before Going Live

- [ ] Changed default admin password
- [ ] Set SESSION_SECRET environment variable
- [ ] Tested post creation/editing
- [ ] Tested image uploads
- [ ] Integrated blog with quiz frontend
- [ ] Added SEO meta tags to all posts
- [ ] Set up Google Analytics (optional)
- [ ] Backed up data/ and uploads/ folders

---

## 🆘 Support

If something isn't working, check:
1. Server logs for errors
2. Browser console for frontend errors
3. Verify all dependencies installed: `npm list`

---

**You're done!** Start writing blog posts at `/admin` 🎉
