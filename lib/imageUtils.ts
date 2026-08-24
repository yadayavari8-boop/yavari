export interface CompressedImage {
  /** Small enough to persist directly in local (non-cloud) mode. */
  dataUrl: string;
  /** Same compressed image as a Blob, ready to upload to cloud storage. */
  blob: Blob;
}

/**
 * Downscales and re-encodes an uploaded photo before it's stored anywhere.
 * A raw phone-camera photo can easily be 3-8MB; this brings it down to a
 * few hundred KB, which is the difference between listings actually saving
 * and silently failing once storage quota (or upload size limits) are hit.
 */
export function compressImage(
  file: File,
  maxDimension = 1280,
  quality = 0.72
): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("وێنەکە نەخوێندرایەوە"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("failed to create image blob"));
              return;
            }
            resolve({ dataUrl, blob });
          },
          "image/jpeg",
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
