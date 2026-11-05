const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Please choose an image file'));
      return;
    }
    if (!ALLOWED.includes(file.type)) {
      reject(new Error('Only JPG, PNG or WEBP images are allowed'));
      return;
    }
    if (file.size > MAX_BYTES) {
      reject(new Error('Image must be 2 MB or smaller'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read that image'));
    reader.readAsDataURL(file);
  });
}
