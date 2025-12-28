import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Custom plugin to handle saving data to local files
const saveDataPlugin = () => ({
  name: 'save-data-plugin',
  configureServer(server) {
    server.middlewares.use('/__api/save', async (req, res, next) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const { file, data } = JSON.parse(body);
            let filePath;
            
            if (file === 'travel') {
              filePath = path.resolve(__dirname, 'src/data/travelData.json');
            } else if (file === 'gallery') {
              filePath = path.resolve(__dirname, 'src/data/galleryData.json');
            } else {
              res.statusCode = 400;
              res.end('Invalid file target');
              return;
            }

            // Write formatting JSON with 2 spaces indentation
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true }));
            console.log(`[Data Saved] Updated ${file} data successfully.`);
          } catch (err) {
            console.error('Error saving data:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      } else {
        next();
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), saveDataPlugin()],
})
