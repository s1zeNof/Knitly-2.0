import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import './ImageEditorModal.css';

/**
 * Повертає обрізане зображення у вигляді { imageBase64, mimeType, width, height }
 * — точно такий формат, що очікує handleImageEditorSave у MessagesPage.
 */
const getCroppedBlob = (imageSrc, pixelCrop, mimeType = 'image/jpeg') =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => {
            const canvas = document.createElement('canvas');
            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;
            canvas.getContext('2d').drawImage(
                image,
                pixelCrop.x, pixelCrop.y,
                pixelCrop.width, pixelCrop.height,
                0, 0,
                pixelCrop.width, pixelCrop.height
            );
            const imageBase64 = canvas.toDataURL(mimeType, 0.92);
            resolve({ imageBase64, mimeType, width: pixelCrop.width, height: pixelCrop.height });
        });
        image.addEventListener('error', reject);
        image.src = imageSrc;
    });

const ImageEditorModal = ({ isOpen, imageToEdit, onClose, onSave }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const onCropComplete = useCallback((_, pixels) => {
        setCroppedAreaPixels(pixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        setIsSaving(true);
        try {
            const imageUrl = imageToEdit instanceof File
                ? URL.createObjectURL(imageToEdit)
                : imageToEdit;
            const mimeType = imageToEdit instanceof File ? imageToEdit.type : 'image/jpeg';
            const result = await getCroppedBlob(imageUrl, croppedAreaPixels, mimeType);
            const name = imageToEdit instanceof File ? imageToEdit.name : 'image.jpg';
            onSave({ ...result, name }, 'HD');
            onClose();
        } catch (e) {
            console.error('Crop error:', e);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !imageToEdit) return null;

    const imageUrl = imageToEdit instanceof File
        ? URL.createObjectURL(imageToEdit)
        : imageToEdit;

    return (
        <div className="image-editor-modal-overlay">
            <div className="image-editor-modal-content">
                <div className="crop-container">
                    <Cropper
                        image={imageUrl}
                        crop={crop}
                        zoom={zoom}
                        aspect={undefined}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>
                <div className="crop-controls">
                    <label className="crop-zoom-label">
                        Масштаб
                        <input
                            type="range"
                            min={1} max={3} step={0.05}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="crop-zoom-slider"
                        />
                    </label>
                    <div className="crop-actions">
                        <button className="crop-btn-cancel" onClick={onClose} disabled={isSaving}>
                            Скасувати
                        </button>
                        <button className="crop-btn-save" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Збереження...' : 'Зберегти'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditorModal;
