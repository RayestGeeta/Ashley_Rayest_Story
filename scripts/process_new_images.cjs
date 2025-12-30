const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SOURCE_DIR = path.join(__dirname, '../src/other/pictures1');
const DEST_DIR = path.join(__dirname, '../public/gallery_images');
const THUMB_DIR = path.join(DEST_DIR, 'thumbnails');
const DATA_FILE = path.join(__dirname, '../src/data/galleryData.json');

// Ensure destination directories exist
if (!fs.existsSync(DEST_DIR)) fs.mkdirSync(DEST_DIR, { recursive: true });
if (!fs.existsSync(THUMB_DIR)) fs.mkdirSync(THUMB_DIR, { recursive: true });

// 1. Delete MP4 files
console.log('Cleaning up MP4 files...');
const files = fs.readdirSync(SOURCE_DIR);
files.forEach(file => {
    if (file.toLowerCase().endsWith('.mp4')) {
        fs.unlinkSync(path.join(SOURCE_DIR, file));
        console.log(`Deleted: ${file}`);
    }
});

// 2. Process Images
console.log('Processing images...');
const remainingFiles = fs.readdirSync(SOURCE_DIR);
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

let galleryData = [];
try {
    if (fs.existsSync(DATA_FILE)) {
        galleryData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
} catch (e) {
    console.error('Error reading gallery data:', e);
}

// Find max ID to increment
let maxId = galleryData.reduce((max, item) => {
    const id = parseInt(item.id);
    return !isNaN(id) && id > max ? id : max;
}, 0);

remainingFiles.forEach((file, index) => {
    const ext = path.extname(file).toLowerCase();
    if (!imageExtensions.includes(ext)) return;

    const sourcePath = path.join(SOURCE_DIR, file);
    const destPath = path.join(DEST_DIR, file);
    const thumbPath = path.join(THUMB_DIR, file);

    console.log(`Processing: ${file}`);

    // Move file
    fs.renameSync(sourcePath, destPath);

    // Compress if > 1MB (using sips)
    try {
        const stats = fs.statSync(destPath);
        if (stats.size > 1024 * 1024) { // 1MB
            console.log(`Compressing ${file}...`);
            execSync(`sips -Z 1600 "${destPath}"`);
        }
    } catch (e) {
        console.error(`Error compressing ${file}:`, e.message);
    }

    // Generate Thumbnail
    try {
        // console.log(`Generating thumbnail for ${file}...`);
        // sips -Z 400 source --out dest
        execSync(`sips -Z 400 "${destPath}" --out "${thumbPath}"`);
    } catch (e) {
        console.error(`Error generating thumbnail for ${file}:`, e.message);
    }

    // Parse Date from Filename (IMG_20251211_...)
    let date = new Date().toISOString();
    const dateMatch = file.match(/(\d{4})(\d{2})(\d{2})/);
    if (dateMatch) {
        const year = dateMatch[1];
        const month = dateMatch[2];
        const day = dateMatch[3];
        // Construct ISO string roughly
        date = `${year}-${month}-${day}T12:00:00.000Z`;
    }

    // Add to Data
    maxId++;
    const newItem = {
        id: maxId,
        src: `/gallery_images/${file}`,
        caption: `Memory #${maxId}`, // Simple caption
        location: "Unknown",
        date: date,
        thumbnail: `/gallery_images/thumbnails/${file}`
    };

    galleryData.push(newItem);
});

// 3. Save JSON
console.log('Updating galleryData.json...');
fs.writeFileSync(DATA_FILE, JSON.stringify(galleryData, null, 2));

console.log('Done!');
