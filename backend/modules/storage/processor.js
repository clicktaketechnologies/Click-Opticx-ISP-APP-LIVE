import sharp from 'sharp';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import logger from '../../utils/logger.js';

/**
 * File Processor
 * Handles compression, resizing and checksum calculation
 */
export async function processFile(file, config = {}) {
  const { compression_quality = 85, max_dimension = 2000 } = config;
  
  const ext = path.extname(file.originalname).toLowerCase();
  const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  
  let processedPath = file.path;
  let checksum = '';

  // 1. Calculate Checksum (Original)
  checksum = await calculateChecksum(file.path);

  // 2. Process Image (if applicable)
  if (isImage) {
    try {
      const tempProcessedPath = `${file.path}_processed${ext}`;
      
      await sharp(file.path)
        .resize({
          width: max_dimension,
          height: max_dimension,
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: compression_quality })
        .toFile(tempProcessedPath);

      processedPath = tempProcessedPath;
      
      // Recalculate checksum for processed file if needed, 
      // but usually we keep the original checksum as the "identity"
    } catch (error) {
      logger.error(`[STORAGE-PROCESSOR] Image processing failed: ${error.message}. Using original.`);
    }
  }

  return {
    path: processedPath,
    checksum,
    originalPath: file.path
  };
}

function calculateChecksum(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

export default { processFile };
