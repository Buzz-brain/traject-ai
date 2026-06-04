import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelPath = path.join(__dirname, 'public', 'model', 'model.json');

// Read model
const modelData = fs.readFileSync(modelPath, 'utf8');
const model = JSON.parse(modelData);

// Replace OrthogonalInitializer with GlorotUniform in all layers
function fixInitializers(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(fixInitializers);
  } else if (obj && typeof obj === 'object') {
    // Check if this is an OrthogonalInitializer
    if (obj.class_name === 'OrthogonalInitializer') {
      console.log('  Replacing OrthogonalInitializer with GlorotUniform');
      obj.class_name = 'GlorotUniform';
      obj.config = { seed: null };
    }
    // Recurse through all properties
    Object.values(obj).forEach(fixInitializers);
  }
}

fixInitializers(model);

// Write fixed model
fs.writeFileSync(modelPath, JSON.stringify(model, null, 2));
console.log('✓ Fixed model.json: OrthogonalInitializer -> GlorotUniform');
