const sharp = require('sharp');
const path = require('path');

sharp(path.join(__dirname, '../src/assets/icon_temp.png'))
  .resize(512, 512)
  .toFile(path.join(__dirname, '../src/assets/icon.png'))
  .then(() => {
    console.log('Icon resized and saved successfully');
    // Clean up temp file
    const fs = require('fs');
    fs.unlinkSync(path.join(__dirname, '../src/assets/icon_temp.png'));
  })
  .catch(err => console.error('Error:', err));