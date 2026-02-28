const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/da5tg6rif/auto/upload";
const UPLOAD_PRESET = "knitly_unsigned";

export const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        throw new Error("Помилка при завантаженні файлу в Cloudinary");
    }

    const data = await res.json();
    return data.secure_url;
};
