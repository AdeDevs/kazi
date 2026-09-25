/** The chat upload accepts only these image types. */
const UPLOADABLE = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Shrinks a photo before it's sent: phone cameras produce 3–8 MB files, which are slow and costly
 * to upload on mobile data. Longest side capped at `maxSide`, re-encoded as JPEG. Anything the
 * upload wouldn't accept (GIF, HEIC…) is always converted; a file the browser can't decode is
 * passed through and the upload reports it.
 */
export async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<string> {
  const original = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = original;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return original;
    ctx.drawImage(img, 0, 0, width, height);
    const compressed = canvas.toDataURL('image/jpeg', quality);
    // Keep whichever is smaller (a small PNG screenshot can grow as a JPEG), if the original is uploadable.
    return UPLOADABLE.includes(file.type) && original.length <= compressed.length ? original : compressed;
  } catch {
    return original;
  }
}
