# Render Deployment Guide

## Image Storage Solution

This application has been configured to work with **Render's ephemeral filesystem** by storing images as **base64 strings directly in the PostgreSQL database** instead of saving them to disk.

### How It Works

1. **Frontend (`public/index.html`):**
   - `uploadFile()` function converts files to base64 using `FileReader`
   - Base64 strings are sent directly in API requests
   - No file upload endpoint needed

2. **Backend:**
   - All image URL columns in database store either:
     - Base64 data URLs (e.g., `data:image/jpeg;base64,/9j/4AAQ...`)
     - External URLs (e.g., `https://example.com/image.jpg`)
   - `getFullImageUrl()` helper detects and returns images as-is

3. **Database:**
   - Image columns use `TEXT` type to store base64 strings
   - No filesystem dependencies
   - Images persist across deployments

### Benefits for Render

✅ **No filesystem storage needed** - Render's ephemeral filesystem doesn't affect images
✅ **Images persist** - Stored in PostgreSQL database
✅ **Zero configuration** - No S3/Cloudinary setup required
✅ **Instant deployment** - Works out of the box

### Limitations

⚠️ **Database size** - Large images increase database size
⚠️ **Response size** - Base64 increases data size by ~33%
⚠️ **Performance** - May be slower for very large images

### Recommended Image Sizes

For optimal performance:
- **Thumbnails:** < 50KB
- **Gallery Images:** < 200KB
- **Hero Images:** < 500KB

Compress images before uploading using tools like:
- TinyPNG (https://tinypng.com/)
- ImageOptim
- Squoosh (https://squoosh.app/)

### Future Migration to Cloud Storage

If you need to handle larger images or reduce database size, consider migrating to:

1. **Cloudinary** (Recommended - Free tier: 25GB)
2. **AWS S3**
3. **Google Cloud Storage**
4. **Vercel Blob Storage**

The application is designed to support both base64 and external URLs, so migration is straightforward.

## Environment Variables

Required for Render deployment:

```
DATABASE_URL=your_neon_postgresql_url
PORT=4000
NODE_ENV=production
```

## Deployment Steps

1. Push code to GitHub
2. Connect Render to your repository
3. Add environment variables
4. Deploy!

Images will work automatically - no additional configuration needed.
