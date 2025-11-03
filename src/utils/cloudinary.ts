import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload une image ou PDF (base64) ou garde l'URL si déjà HTTP
 */
export const uploadImageToCloudinary = async (
  data: string,
  folder: string
): Promise<string> => {
  if (data.startsWith('http')) return data;
  if (/^data:(image\/.+|application\/pdf);base64,/.test(data)) {
    const res = await cloudinary.uploader.upload(data, {
      folder,
      resource_type: 'auto',
    });
    return res.secure_url;
  }
  throw new Error('Format de fichier non supporté.');
};

/**
 * Helper spécialisé vidéo (facultatif) :
 * - Data URL base64 (video/*) ⇒ upload en 'video'
 * - URL http(s) ⇒ retourne l’URL
 * - sinon fallback sur uploadAnyToCloudinary
 */
export const uploadVideoToCloudinary = async (
  data: string,
  folder = 'videos'
): Promise<string> => {
  if (/^https?:\/\//i.test(data)) return data;

  if (/^data:video\/.+;base64,/.test(data)) {
    const res = await cloudinary.uploader.upload(data, {
      folder,
      resource_type: 'video', // force le type vidéo
    });
    return res.secure_url;
  }

  // fallback auto
  throw new Error('Format de fichier non supporté.');
};