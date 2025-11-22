const fs = require('fs');
const path = require('path');

// Routes to update with their cache patterns
const routes = [
  { file: 'media.js', pattern: 'GET:/api/media.*' },
  { file: 'research.js', pattern: 'GET:/api/research.*' },
  { file: 'design.js', pattern: 'GET:/api/design.*' },
  { file: 'education.js', pattern: 'GET:/api/education.*' },
  { file: 'newsevents.js', pattern: 'GET:/api/newsevents.*' },
  { file: 'home.js', pattern: 'GET:/api/home.*' },
];

// Cache clearing snippet
const cacheClearingCode = (pattern) => `
        // Clear cache
        clearCachePattern('${pattern}');
`;

routes.forEach(route => {
  const filePath = path.join(__dirname, 'routes', route.file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if clearCachePattern is already imported
    if (!content.includes('clearCachePattern')) {
      // Add import after the first require statement
      const firstRequireEnd = content.indexOf(');');
      if (firstRequireEnd !== -1) {
        const insertPos = firstRequireEnd + 2;
        content = content.slice(0, insertPos) + 
          `const { clearCachePattern } = require("../middleware/cache");\n` +
          content.slice(insertPos);
      }
    }
    
    console.log(`✅ Updated ${route.file}`);
  } catch (error) {
    console.error(`❌ Error updating ${route.file}:`, error.message);
  }
});

console.log('\n📝 Note: You still need to manually add clearCachePattern() calls');
console.log('before res.json() or res.status().json() in POST/PUT/DELETE routes');
console.log('\nExample:');
console.log('  // Clear cache');
console.log('  clearCachePattern(\'GET:/api/media.*\');');
console.log('  res.status(200).json({ success: true, data: result.rows[0] });');
