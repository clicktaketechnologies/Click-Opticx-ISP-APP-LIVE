
/**
 * Cloudinary Frontend Upload Utility
 * Handles direct uploads to Cloudinary using unsigned presets.
 */

export interface CloudinaryUploadResponse {
  success: boolean;
  url?: string;
  public_id?: string;
  error?: string;
}

export const uploadToCloudinary = async (
  file: File | Blob, 
  path: string,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResponse> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = 'ml_default'; // Default unsigned preset for Click Opticx

  if (!cloudName) {
    return { success: false, error: 'Cloudinary Cloud Name not configured' };
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('public_id', path);
  formData.append('folder', 'click-opticx-isp');

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.secure_url) {
      return { 
        success: true, 
        url: data.secure_url, 
        public_id: data.public_id 
      };
    }

    return { 
      success: false, 
      error: data.error?.message || 'Upload failed' 
    };
  } catch (err: any) {
    console.error('[CLOUDINARY] Upload Error:', err);
    return { 
      success: false, 
      error: err.message || 'Network error during upload' 
    };
  }
};
