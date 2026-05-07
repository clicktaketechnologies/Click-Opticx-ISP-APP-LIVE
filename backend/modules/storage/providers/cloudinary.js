import { v2 as cloudinary } from 'cloudinary';

/**
 * Cloudinary Storage Provider
 */
export async function upload(file, options = {}) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: options.folder || 'kyc',
      public_id: options.publicId,
      resource_type: 'auto',
      overwrite: true,
      tags: ['kyc', file.userId],
      context: { userId: file.userId }
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
