/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  originalFormatted: string;
  compressedFormatted: string;
  savedPercentage: number;
  originalDimensions: { width: number; height: number };
  compressedDimensions: { width: number; height: number };
  fileName: string;
  fileType: string;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function compressAndResizeImage(
  file: File,
  maxDimension = 1280,
  quality = 0.82
): Promise<CompressionResult> {
  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca fail gambar.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format imej tidak disokong atau fail rosak.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const originalDimensions = { width, height };

        // Scale down if larger than maxDimension while keeping aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal memulakan kanvas 2D untuk pemprosesan imej.'));
          return;
        }

        // High quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP if supported, fallback to JPEG
        let mimeType = 'image/jpeg';
        let dataUrl = canvas.toDataURL(mimeType, quality);

        // Calculate compressed byte size from dataUrl
        const base64Data = dataUrl.split(',')[1] || '';
        const compressedSize = Math.round((base64Data.length * 3) / 4);

        const savedBytes = Math.max(0, originalSize - compressedSize);
        const savedPercentage = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;

        resolve({
          dataUrl,
          originalSize,
          compressedSize,
          originalFormatted: formatBytes(originalSize),
          compressedFormatted: formatBytes(compressedSize),
          savedPercentage,
          originalDimensions,
          compressedDimensions: { width, height },
          fileName: file.name,
          fileType: mimeType,
        });
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
