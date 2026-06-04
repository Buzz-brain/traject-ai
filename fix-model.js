const fs = require('fs');
const path = require('path');

const modelPath = path.join(__dirname, 'public', 'model', 'model.json');
const data = fs.readFileSync(modelPath, 'utf8');
const fixed = data.replace(/\"batch_shape\"/g, '"batchInputShape"');
fs.writeFileSync(modelPath, fixed);

console.log('✓ Fixed model.json: batch_shape -> batchInputShape');
