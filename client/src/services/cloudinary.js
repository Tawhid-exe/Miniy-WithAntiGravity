// ═══════════════════════════════════════════════════════════════
//  cloudinary.js — Unsigned direct upload to Cloudinary
//  No backend needed — uses unsigned upload preset
// ═══════════════════════════════════════════════════════════════

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export async function uploadImage(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'miniy-products');

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

        if (onProgress) {
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
            };
        }

        xhr.onload = () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                resolve({ url: data.secure_url, publicId: data.public_id });
            } else {
                reject(new Error('Cloudinary upload failed'));
            }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
    });
}

export async function uploadMultipleImages(files, onProgress) {
    const total = files.length;
    let completed = 0;
    const results = [];
    for (const file of files) {
        const result = await uploadImage(file, (pct) => {
            if (onProgress) onProgress(Math.round(((completed + pct / 100) / total) * 100));
        });
        results.push(result);
        completed++;
    }
    return results;
}
