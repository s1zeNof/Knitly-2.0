import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Guard: supabase client is kept for compatibility but all uploads now use Cloudinary.
// If env vars are missing (e.g. Vercel without Supabase vars), we skip createClient
// to avoid crashing the app at startup.
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

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
    return new Promise(async (resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        // Step 1: Try XHR — supports upload progress events on desktop
        const xhrResult = await new Promise((xhrResolve) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable && onProgress) {
                    onProgress(Math.round((event.loaded / event.total) * 100));
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        xhrResolve({ ok: true, url: JSON.parse(xhr.responseText).secure_url });
                    } catch {
                        xhrResolve({ ok: true, url: '' });
                    }
                } else {
                    try {
                        const err = JSON.parse(xhr.responseText);
                        xhrResolve({ ok: false, error: err.error?.message || `Помилка ${xhr.status}` });
                    } catch {
                        xhrResolve({ ok: false, error: `Помилка ${xhr.status}: ${xhr.statusText}` });
                    }
                }
            });

            // On mobile (iOS/Android) XHR sometimes fires 'error' instead of 'load'.
            // We don't reject here — instead mark as failed so fetch fallback kicks in.
            xhr.addEventListener('error', () => xhrResolve({ ok: false, needsFallback: true }));
            xhr.addEventListener('abort', () => xhrResolve({ ok: false, error: 'Завантаження скасовано' }));

            xhr.open('POST', CLOUDINARY_URL);
            xhr.timeout = 90000; // 90-second safety timeout
            xhr.addEventListener('timeout', () => xhrResolve({ ok: false, needsFallback: true }));
            xhr.send(formData);
        });

        // XHR succeeded — return immediately
        if (xhrResult.ok) return resolve(xhrResult.url);

        // XHR had a hard HTTP error — no point retrying
        if (xhrResult.error && !xhrResult.needsFallback) return reject(new Error(xhrResult.error));

        // Step 2: Fallback to fetch (more reliable on mobile browsers)
        console.warn('[Upload] XHR network error — retrying with fetch…');
        if (onProgress) onProgress(30); // Show indeterminate progress
        try {
            const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error?.message || `Помилка ${res.status}`);
            }
            const data = await res.json();
            if (onProgress) onProgress(100);
            resolve(data.secure_url);
        } catch (fetchErr) {
            reject(new Error('Мережева помилка при завантаженні. Перевір з\'єднання та спробуй ще раз.'));
        }
    });
};


export const deleteSupabaseFile = async (bucket, path) => {
    console.warn('[Cloudinary] Видалення з фронтенду не підтримується для Unsigned Presets. Пропущено.');
};

export const getSupabasePublicUrl = (bucket, path) => {
    return path; // Повертає той самий шлях для сумісності
};
