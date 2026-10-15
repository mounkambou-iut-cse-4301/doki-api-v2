// import { v2 as cloudinary } from 'cloudinary';
// import 'dotenv/config';

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key:    process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// /**
//  * Upload une image ou PDF (base64) ou garde l'URL si déjà HTTP
//  */
// export const uploadImageToCloudinary = async (
//   data: string,
//   folder: string
// ): Promise<string> => {
//   if (data.startsWith('http')) return data;
//   if (/^data:(image\/.+|application\/pdf);base64,/.test(data)) {
//     const res = await cloudinary.uploader.upload(data, {
//       folder,
//       resource_type: 'auto',
//     });
//     return res.secure_url;
//   }
//   throw new Error('Format de fichier non supporté.');
// };

// /**
//  * Helper spécialisé vidéo (facultatif) :
//  * - Data URL base64 (video/*) ⇒ upload en 'video'
//  * - URL http(s) ⇒ retourne l’URL
//  * - sinon fallback sur uploadAnyToCloudinary
//  */
// export const uploadVideoToCloudinary = async (
//   data: string,
//   folder = 'videos'
// ): Promise<string> => {
//   if (/^https?:\/\//i.test(data)) return data;

//   if (/^data:video\/.+;base64,/.test(data)) {
//     const res = await cloudinary.uploader.upload(data, {
//       folder,
//       resource_type: 'video', // force le type vidéo
//     });
//     return res.secure_url;
//   }

//   // fallback auto
//   throw new Error('Format de fichier non supporté.');
// };

import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function apercuData(data: string, max = 80): string {
  if (!data) return 'vide';
  return data.length > max ? `${data.slice(0, max)}...` : data;
}

/** Decode a profile image and upload it; empty values leave the profile unchanged. */
export const uploadProfileToCloudinary = async (
  profile: string | null | undefined,
  folder: string,
): Promise<string | undefined> => {
  if (profile == null || profile.trim() === '') return undefined;

  const value = profile.trim();
  if (/^https:\/\//i.test(value)) {
    // Validate the URL without fetching or uploading the remote image.
    new URL(value);
    return profile;
  }

  const dataUrl = /^data:image\/[a-z0-9.+-]+;base64,([\s\S]+)$/i.exec(value);
  const encoded = (dataUrl ? dataUrl[1] : value).replace(/\s/g, '');
  const buffer = Buffer.from(encoded, 'base64');
  if (
    !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) ||
    buffer.length === 0 ||
    buffer.toString('base64').replace(/=+$/, '') !== encoded.replace(/=+$/, '')
  ) {
    throw new Error(
      'Le profil doit être une image base64 ou une URL HTTPS valide.',
    );
  }

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(new Error(error.message));
        if (!result?.secure_url) {
          return reject(new Error("Cloudinary n'a pas retourné l'URL du profil."));
        }
        resolve(result.secure_url);
      },
    );
    stream.on('error', reject);
    stream.end(buffer);
  });
};

/**
 * Upload une image ou PDF (base64) ou garde l'URL si déjà HTTP
 */
export const uploadImageToCloudinary = async (
  data: string,
  folder: string,
): Promise<string> => {
  if (!data || !data.trim()) {
    throw new Error(
      "Aucun fichier image/PDF fourni. Envoyez une URL http(s) ou un base64 valide.",
    );
  }

  if (/^https?:\/\//i.test(data)) return data;

  if (/^data:(image\/.+|application\/pdf);base64,/i.test(data)) {
    const res = await cloudinary.uploader.upload(data, {
      folder,
      resource_type: 'auto',
    });
    return res.secure_url;
  }

  throw new Error(
    `Format invalide pour une image/PDF. Attendu: URL http(s), data:image/...;base64,... ou data:application/pdf;base64,.... Reçu: ${apercuData(data)}`,
  );
};

/**
 * Upload vidéo
 * - URL http(s) => retourne l’URL
 * - Data URL base64 (video/*) => upload en 'video'
 */
export const uploadVideoToCloudinary = async (
  data: string,
  folder = 'videos',
): Promise<string> => {
  if (!data || !data.trim()) {
    throw new Error(
      "Aucune vidéo fournie. Envoyez une URL http(s) ou un base64 valide commençant par data:video/...;base64,",
    );
  }

  if (/^https?:\/\//i.test(data)) return data;

  if (/^data:video\/.+;base64,/i.test(data)) {
    const res = await cloudinary.uploader.upload(data, {
      folder,
      resource_type: 'video',
    });
    return res.secure_url;
  }

  throw new Error(
    `Format invalide pour une vidéo. Attendu: URL http(s) ou data:video/...;base64,.... Reçu: ${apercuData(data)}`,
  );
};
