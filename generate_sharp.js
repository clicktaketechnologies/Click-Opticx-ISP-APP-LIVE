import sharp from 'sharp';
import path from 'path';

async function generate() {
  const input = './public/favicon.png';
  
  // 512x512
  await sharp(input)
    .resize(400, 400, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .extend({
      top: 56, bottom: 56, left: 56, right: 56,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .flatten({ background: '#ffffff' })
    .toFile('./public/icons/icon-512.png');
    
  console.log('Generated icon-512.png');

  // 192x192
  await sharp(input)
    .resize(150, 150, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .extend({
      top: 21, bottom: 21, left: 21, right: 21,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .flatten({ background: '#ffffff' })
    .toFile('./public/icons/icon-192.png');
    
  console.log('Generated icon-192.png');
}

generate().catch(console.error);
