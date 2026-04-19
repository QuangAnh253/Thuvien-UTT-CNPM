import { getApiUrl } from './auth';

const MAX_RAW_SIZE = 8 * 1024 * 1024;
const MAX_SIDE = 720;

const ensureImageFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Vui lòng chọn file ảnh hợp lệ.');
  }

  if (file.size > MAX_RAW_SIZE) {
    throw new Error('Ảnh quá lớn. Vui lòng chọn ảnh dưới 8MB.');
  }
};

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Không thể đọc file ảnh.'));
    };

    img.src = objectUrl;
  });

const compressImage = async (file: File): Promise<Blob> => {
  const image = await loadImage(file);

  const ratio = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
  const targetWidth = Math.max(1, Math.round(image.width * ratio));
  const targetHeight = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Không thể xử lý ảnh trên trình duyệt này.');
  }

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', 0.82);
  });

  if (blob) return blob;

  const jpegBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.82);
  });

  if (!jpegBlob) {
    throw new Error('Không thể nén ảnh. Vui lòng thử ảnh khác.');
  }

  return jpegBlob;
};

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Không thể chuyển ảnh sang base64.'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Không thể đọc dữ liệu ảnh.'));
    reader.readAsDataURL(blob);
  });

const uploadToCloudinary = async (blob: Blob): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Thiếu cấu hình Cloudinary.');
  }

  const formData = new FormData();
  formData.append('file', blob, 'avatar.webp');
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'utt-library/avatars');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || 'Upload ảnh lên Cloudinary thất bại.');
  }

  return String(data.secure_url);
};

const uploadToImgBB = async (blob: Blob): Promise<string> => {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error('Thiếu cấu hình ImgBB API key.');
  }

  const image = await blobToBase64(blob);
  const formData = new FormData();
  formData.append('image', image);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  const imageUrl = data?.data?.url;

  if (!res.ok || !imageUrl) {
    throw new Error('Upload ảnh lên ImgBB thất bại.');
  }

  return String(imageUrl);
};

export const uploadAvatarFile = async (file: File): Promise<string> => {
  ensureImageFile(file);
  const compressed = await compressImage(file);

  if (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) {
    return uploadToCloudinary(compressed);
  }

  if (import.meta.env.VITE_IMGBB_API_KEY) {
    return uploadToImgBB(compressed);
  }

  throw new Error(
    'Chưa cấu hình dịch vụ upload ảnh. Hãy thêm VITE_CLOUDINARY_CLOUD_NAME + VITE_CLOUDINARY_UPLOAD_PRESET hoặc VITE_IMGBB_API_KEY vào file môi trường frontend.'
  );
};

export const isLikelyImageUrl = (value: string) => {
  const url = String(value || '').trim();
  return /^https?:\/\//i.test(url) || url.startsWith(getApiUrl('/'));
};
