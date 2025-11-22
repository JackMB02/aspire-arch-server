# Frontend Integration Guide for Design Projects

## Backend Routes

### Get All Design Projects
```
GET /api/design/projects
```
Returns all published design projects.

### Get Single Project Details
```
GET /api/design/project/:id
```
Returns a single design project by ID with all content blocks.

### Get Projects by Category
```
GET /api/design/projects/academic
GET /api/design/projects/professional
GET /api/design/projects/competition
```

## Response Format

Each design project returns:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Project Title",
    "summary": "Project summary text",
    "category": "academic",
    "sector": "residential",
    "main_image": "https://res.cloudinary.com/.../main.jpg",
    "mainImage": "https://res.cloudinary.com/.../main.jpg",
    "contentBlocks": [
      {
        "type": "text",
        "title": "Section Title",
        "content": "Text content here..."
      },
      {
        "type": "image",
        "caption": "Image caption",
        "imageUrl": "https://res.cloudinary.com/.../image1.jpg"
      }
    ],
    "gallery_images": [...], // Same as contentBlocks
    "display_order": 0,
    "is_featured": false,
    "is_published": true,
    "created_at": "2025-11-22T...",
    "updated_at": "2025-11-22T..."
  }
}
```

## Frontend Implementation

### 1. Fetch Project Details

```javascript
async function loadProjectDetails(projectId) {
  try {
    const response = await fetch(`https://your-api.com/api/design/project/${projectId}`);
    const data = await response.json();
    
    if (data.success) {
      displayProject(data.data);
    }
  } catch (error) {
    console.error('Error loading project:', error);
  }
}
```

### 2. Display Project Content

```javascript
function displayProject(project) {
  // Display main image
  const mainImage = document.getElementById('project-main-image');
  mainImage.src = project.mainImage;
  mainImage.alt = project.title;
  
  // Display title and summary
  document.getElementById('project-title').textContent = project.title;
  document.getElementById('project-summary').textContent = project.summary;
  
  // Display content blocks
  const contentContainer = document.getElementById('project-content');
  contentContainer.innerHTML = '';
  
  project.contentBlocks.forEach(block => {
    if (block.type === 'text') {
      // Render text block
      const textBlock = document.createElement('div');
      textBlock.className = 'text-block';
      
      if (block.title) {
        const title = document.createElement('h3');
        title.textContent = block.title;
        textBlock.appendChild(title);
      }
      
      const content = document.createElement('p');
      content.textContent = block.content;
      textBlock.appendChild(content);
      
      contentContainer.appendChild(textBlock);
      
    } else if (block.type === 'image') {
      // Render image block
      const imageBlock = document.createElement('div');
      imageBlock.className = 'image-block';
      
      const img = document.createElement('img');
      img.src = block.imageUrl;
      img.alt = block.caption || project.title;
      imageBlock.appendChild(img);
      
      if (block.caption) {
        const caption = document.createElement('p');
        caption.className = 'image-caption';
        caption.textContent = block.caption;
        imageBlock.appendChild(caption);
      }
      
      contentContainer.appendChild(imageBlock);
    }
  });
}
```

### 3. Create Image Slideshow

If you want to show all images (main image + all image blocks) in a slideshow:

```javascript
function createProjectSlideshow(project) {
  const images = [];
  
  // Add main image
  images.push({
    url: project.mainImage,
    caption: project.title
  });
  
  // Add all images from content blocks
  project.contentBlocks.forEach(block => {
    if (block.type === 'image') {
      images.push({
        url: block.imageUrl,
        caption: block.caption || ''
      });
    }
  });
  
  // Initialize your slideshow library with images array
  initSlideshow(images);
}

// Example with a simple slideshow
function initSlideshow(images) {
  let currentIndex = 0;
  const slideshowContainer = document.getElementById('slideshow');
  
  // Create slideshow HTML
  slideshowContainer.innerHTML = `
    <div class="slideshow-wrapper">
      <button class="prev" onclick="changeSlide(-1)">❮</button>
      <div class="slide-container">
        <img id="slideshow-image" src="${images[0].url}" alt="${images[0].caption}">
        <div class="slide-caption">${images[0].caption}</div>
      </div>
      <button class="next" onclick="changeSlide(1)">❯</button>
      <div class="slide-counter">1 / ${images.length}</div>
    </div>
  `;
  
  window.changeSlide = function(direction) {
    currentIndex += direction;
    if (currentIndex >= images.length) currentIndex = 0;
    if (currentIndex < 0) currentIndex = images.length - 1;
    
    document.getElementById('slideshow-image').src = images[currentIndex].url;
    document.querySelector('.slide-caption').textContent = images[currentIndex].caption;
    document.querySelector('.slide-counter').textContent = `${currentIndex + 1} / ${images.length}}`;
  };
}
```

### 4. React/Next.js Example

```jsx
import { useEffect, useState } from 'react';

export default function ProjectDetailsPage({ projectId }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadProject() {
      try {
        const response = await fetch(`/api/design/project/${projectId}`);
        const data = await response.json();
        setProject(data.data);
      } catch (error) {
        console.error('Error loading project:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadProject();
  }, [projectId]);
  
  if (loading) return <div>Loading...</div>;
  if (!project) return <div>Project not found</div>;
  
  // Extract all images for slideshow
  const allImages = [
    { url: project.mainImage, caption: project.title },
    ...project.contentBlocks
      .filter(block => block.type === 'image')
      .map(block => ({ url: block.imageUrl, caption: block.caption }))
  ];
  
  return (
    <div className="project-details">
      <h1>{project.title}</h1>
      <p className="summary">{project.summary}</p>
      
      {/* Image Slideshow */}
      <ImageSlideshow images={allImages} />
      
      {/* Content Blocks */}
      <div className="project-content">
        {project.contentBlocks.map((block, index) => (
          <div key={index}>
            {block.type === 'text' && (
              <div className="text-block">
                {block.title && <h3>{block.title}</h3>}
                <p>{block.content}</p>
              </div>
            )}
            {block.type === 'image' && (
              <div className="image-block">
                <img src={block.imageUrl} alt={block.caption} />
                {block.caption && <p className="caption">{block.caption}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Key Points

1. **No Description Field**: The `description` field has been removed. Use `contentBlocks` instead.

2. **Content Blocks Structure**: Each content block is either:
   - Text block: `{ type: "text", title?: string, content: string }`
   - Image block: `{ type: "image", caption?: string, imageUrl: string }`

3. **Images for Slideshow**: Collect all images by:
   - Starting with `project.mainImage`
   - Adding all `contentBlocks` where `type === "image"`

4. **Backward Compatibility**: The API returns both `contentBlocks` and `gallery_images` (same data) for backward compatibility.

5. **Image URLs**: All images are stored on Cloudinary and return full URLs, ready to display.
