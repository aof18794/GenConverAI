# GenConverAI Deployment Guide

This guide covers deploying your React + Vite app using industry best practices.

## 🚀 Recommended Deployment Platforms

### 1. **Vercel** (Recommended ⭐)

**Best for:** Zero-config deployments, automatic HTTPS, edge network

**Pros:**

- Automatic CI/CD from Git
- Automatic HTTPS & CDN
- Environment variables management
- Zero configuration for Vite
- Excellent performance

**Deploy Steps:**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd /Users/siravich/.gemini/antigravity/scratch/react-starter
vercel

# Follow prompts:
# - Link to your Git repository (recommended)
# - Set project name
# - Deploy!
```

**Or use Vercel Dashboard:**

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository
5. Vercel auto-detects Vite settings
6. Click "Deploy"

---

### 2. **Netlify**

**Best for:** Simple static hosting, form handling, serverless functions

**Deploy Steps:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build your app
npm run build

# Deploy
netlify deploy

# For production
netlify deploy --prod
```

**Or use Netlify Dashboard:**

1. Go to [netlify.com](https://netlify.com)
2. Connect your Git repository
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Deploy

---

### 3. **GitHub Pages**

**Best for:** Free hosting for open-source projects

**Setup:**

1. Install gh-pages:

```bash
npm install --save-dev gh-pages
```

2. Update `package.json`:

```json
{
  "homepage": "https://YOUR_USERNAME.github.io/YOUR_REPO_NAME",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. Update `vite.config.js`:

```javascript
export default {
  base: "/YOUR_REPO_NAME/",
};
```

4. Deploy:

```bash
npm run deploy
```

---

## 🔐 Environment Variables & Security

This project uses **Vercel Serverless Functions** to secure the Gemini API key.

### 1. **Hybrid API Key System**

- **User Keys:** Users can optionally provide their own key in the settings (stored in `localStorage`).
- **Server Fallback:** If no user key is provided, the app uses the server-side `GEMINI_API_KEY`.

### 2. **Production Configuration**

When deploying to Vercel, you **MUST** set the environment variable:

1. Go to Vercel Project Settings > **Environment Variables**
2. Add New Variable:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** `your-actual-gemini-api-key`
   - **Environments:** Production, Preview, Development

> **⚠️ IMPORTANT:** Without this variable, the "server fallback" mode will fail in production.

---

## 📦 Build Optimization

Before deploying, optimize your build:

### 1. **Create Production Build**

```bash
npm run build
```

### 2. **Preview Production Build Locally**

```bash
npm run preview
```

### 3. **Optimize Build Settings**

Update `vite.config.js`:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          icons: ["lucide-react"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

---

## ✅ Pre-Deployment Checklist

- [ ] Test build locally: `npm run build && npm run preview`
- [ ] Remove console.logs from production code
- [ ] Add `.env` to `.gitignore` (if using env vars)
- [ ] Verify all assets load correctly
- [ ] Test on mobile devices
- [ ] Check browser console for errors
- [ ] Verify API calls work in production
- [ ] Test with different API keys
- [ ] Add proper error handling for API failures

---

## 🌐 Custom Domain Setup

### Vercel:

1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed

### Netlify:

1. Go to Domain Settings
2. Add custom domain
3. Configure DNS

---

## 🔄 Continuous Deployment (CI/CD)

**Recommended Setup:**

1. **Connect Git Repository**

   - Push code to GitHub/GitLab/Bitbucket
   - Connect to Vercel/Netlify

2. **Automatic Deployments**

   - Main branch → Production
   - Pull requests → Preview deployments

3. **Example GitHub Actions** (optional):

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 📊 Performance Optimization

### 1. **Enable Compression**

Most platforms (Vercel, Netlify) auto-enable Brotli/Gzip.

### 2. **Lazy Load Routes**

```javascript
const Quiz = lazy(() => import("./components/Quiz"));
```

### 3. **Image Optimization**

- Use WebP format
- Compress avatars
- Consider image CDN

### 4. **Code Splitting**

Already handled by Vite's default config.

---

## 🛡️ Security Best Practices

1. **Content Security Policy (CSP)**
   Add to `index.html` or hosting platform headers:

   ```html
   <meta
     http-equiv="Content-Security-Policy"
     content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
   />
   ```

2. **HTTPS Only**

   - All platforms provide automatic HTTPS
   - Never use HTTP in production

3. **API Key Management**
   - Current approach: User-provided keys ✅
   - Future: Move to backend API

---

## 📈 Monitoring & Analytics

### Recommended Tools:

1. **Error Tracking:** [Sentry](https://sentry.io)
2. **Analytics:** [Google Analytics](https://analytics.google.com) or [Plausible](https://plausible.io)
3. **Performance:** [Vercel Analytics](https://vercel.com/analytics) or [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

## 🚀 Quick Start: Deploy to Vercel Now

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Navigate to project
cd /Users/siravich/.gemini/antigravity/scratch/react-starter

# 3. Deploy
vercel

# That's it! Your app is live! 🎉
```

---

## 🆘 Troubleshooting

### Build Fails

- Check Node version: `node --version` (need 16+)
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check build logs for specific errors

### Blank Page After Deploy

- Check `base` in `vite.config.js`
- Verify build output in `dist` folder
- Check browser console for errors
- Ensure paths are correct (absolute vs relative)

### API Not Working

- Check CORS settings
- Verify API key is set correctly
- Check network tab for failed requests

---

## 📝 Summary

**Recommended Stack:**

- **Hosting:** Vercel (easiest, best performance)
- **CI/CD:** GitHub + Vercel (automatic)
- **Domain:** Custom domain via Vercel
- **Monitoring:** Vercel Analytics + Sentry

**Time to Deploy:** ~5 minutes with Vercel! 🚀
