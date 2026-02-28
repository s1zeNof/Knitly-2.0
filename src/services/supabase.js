import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/da5tg6rif/auto/upload";
const UPLOAD_PRESET = "knitly_unsigned";

export const uploadFile = async (file, bucket, path) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        throw new Error("Failed to upload to Cloudinary");
    }

    const data = await res.json();
    return data.secure_url;
};

export const uploadFileWithProgress = (file, bucket, path, onProgress) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
                const progress = Math.round((event.loaded / event.total) * 100);
                onProgress(progress);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    resolve(data.secure_url);
                } catch {
                    resolve('');
                }
            } else {
                try {
                    const err = JSON.parse(xhr.responseText);
                    reject(new Error(err.error?.message || `Помилка ${xhr.status}: ${xhr.statusText}`));
                } catch {
                    reject(new Error(`Помилка завантаження: HTTP ${xhr.status}`));
                }
            }
        });

        xhr.addEventListener('error', () => reject(new Error('Мережева помилка при завантаженні')));
        xhr.addEventListener('abort', () => reject(new Error('Завантаження скасовано')));

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        xhr.open('POST', CLOUDINARY_URL);
        xhr.send(formData);
    });
};

export const deleteSupabaseFile = async (bucket, path) => {
    console.warn('[Cloudinary] Видалення з фронтенду не підтримується для Unsigned Presets. Пропущено.');
};

export const getSupabasePublicUrl = (bucket, path) => {
    return path; // Повертає той самий шлях для сумісності
};
