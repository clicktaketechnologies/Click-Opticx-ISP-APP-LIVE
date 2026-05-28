import { v2 as cloudinary } from 'cloudinary';

// Configure once at module load — never inside upload calls
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Cloudinary Storage Provider
 */
export async function upload(file, options = {}) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    throw new Error('Cloudinary credentials not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
  }

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: options.folder || 'kyc',
      public_id: options.publicId,
      resource_type: 'auto',
      overwrite: true,
      tags: ['kyc', file.userId].filter(Boolean),
      context: { userId: file.userId || 'unknown' }
    });

    return {
      success: true,
      url: result.secure_url,
      provider: 'cloudinary',
      providerData: result
    };
  } catch (error) {
    throw new Error(`Cloudinary Upload Error: ${error.message}`);
  }
}

export default { upload };
