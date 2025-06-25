import React, { useState, useEffect, useRef } from 'react';
import FilerobotImageEditor, { TABS, TOOLS } from 'react-filerobot-image-editor';
import './ImageEditorModal.css';

const ImageEditorModal = ({ isOpen, imageToEdit, onClose, onSave }) => {
    const [key, setKey] = useState(0);
    const filerobotEditorRef = useRef(null);

    useEffect(() => {
        if (imageToEdit) {
            setKey(prevKey => prevKey + 1);
        }
    }, [imageToEdit]);

    if (!isOpen || !imageToEdit) {
        return null;
    }

    const triggerSave = (quality) => {
        if (filerobotEditorRef.current && filerobotEditorRef.current.getCurrentImgData) {
            const { imageData } = filerobotEditorRef.current.getCurrentImgData(
                { /* imageName, imageExtension can be passed here if needed */ },
                false // Use default pixelRatio for saving
            );

            if (imageData) {
                onSave(imageData, quality);
                onClose();
            } else {
                console.error("Failed to get image data from editor.");
                // Optionally show a notification to the user here
            }
        } else {
            console.error("Editor ref not available or getCurrentImgData is not a function.");
        }
    };

    const imageUrl = imageToEdit instanceof File ? URL.createObjectURL(imageToEdit) : imageToEdit;

    return (
        <div className="image-editor-modal-overlay" onClick={onClose}>
            <div className="image-editor-modal-content" onClick={e => e.stopPropagation()}>
                <div className="editor-wrapper">
                    <FilerobotImageEditor
                        ref={filerobotEditorRef}
                        key={key}
                        source={imageUrl}
                        onClose={onClose} // Filerobot's own close button
                        removeSaveButton={true} // Hide Filerobot's default save button
                        closeAfterSave={false} // We handle closing via our custom buttons
                        disableZooming={true} // Disable general canvas zooming as requested
                        defaultSavedImageType="JPEG" // Default save type, user won't see options for this with custom save

                        tabsIds={[TABS.CROP, TABS.FILTERS, TABS.FINETUNE, TABS.ADJUST, TABS.ANNOTATE]}
                        defaultTabId={TABS.CROP}
                        defaultToolId={TOOLS.CROP} // Make sure to use TOOLS.CROP for the crop tool

                        // Configure Pen tool for drawing (within ANNOTATE tab)
                        Pen={{
                            strokeWidth: 5,
                            colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#000000', '#FFFFFF', '#FF69B4'], // Added Pink
                        }}

                        translations={{
                            // Common
                            save: 'Надіслати', // General save, though ours will be more specific
                            cancel: 'Скасувати',
                            close: 'Закрити',
                            apply: 'Застосувати',
                            // Tabs
                            [TABS.CROP]: 'Обрізка',
                            [TABS.FILTERS]: 'Фільтри',
                            [TABS.FINETUNE]: 'Налаштування', // Renamed from 'Тонке налаштування' for brevity
                            [TABS.ADJUST]: 'Корекція',    // Renamed from 'Налаштування' to avoid conflict
                            [TABS.ANNOTATE]: 'Малювання',
                            // Tools
                            [TOOLS.CROP]: 'Обрізати',
                            [TOOLS.PEN]: 'Олівець',
                            brightness: 'Яскравість',
                            contrast: 'Контраст',
                            saturation: 'Насиченість',
                            vibrance: 'Соковитість',
                            warmth: 'Теплота',
                            exposure: 'Експозиція',
                            gamma: 'Гамма',
                            blur: 'Розмиття',
                            sharpen: 'Різкість',
                            cropOriginalRatio: 'Оригінал',
                            cropCustomRatio: 'Довільно',
                        }}
                        theme={{
                            palette: {
                                'bg-primary': '#232323',
                                'bg-secondary': '#1a1a1a',
                                'accent-primary': '#8a2be2', // Knitly Purple
                                'accent-primary-active': '#7b24cb',
                                'icons-primary': '#ffffff',
                                'icons-secondary': '#a0a0a0',
                                'txt-primary': '#ffffff',
                                'txt-secondary': '#b0b0b0',
                                'borders-primary': '#3a3a3a',
                                'borders-secondary': '#4f4f4f',
                                'borders-strong': '#606060',
                                'light-shadow': 'rgba(0, 0, 0, 0.3)',
                            },
                            typography: {
                                fontFamily: "'Inter', sans-serif", // Assuming Knitly uses Inter
                            },
                        }}
                        // Regarding hiding specific zoom/resize controls within tools like Crop:
                        // Filerobot doesn't seem to offer granular props to hide sub-elements of tools like the specific resize inputs
                        // if they are part of the Crop UI. `disableZooming` handles the main canvas zoom.
                        // CSS overrides would be the next step if specific parts of tools need hiding (e.g. .FIE_crop-presets-wrapper, .FIE_crop-ratio-inputs)
                        // but this can be brittle.
                        // For "Прибрати зміну розширення для фото": defaultSavedImageType and our custom save logic
                        // effectively achieve this as the user doesn't get to pick a format with our buttons.
                    />
                </div>
                <div className="editor-custom-actions">
                    <button onClick={onClose} className="editor-button editor-button-cancel">Скасувати</button>
                    <div>
                        <button onClick={() => triggerSave('SD')} className="editor-button editor-button-sd">Надіслати SD</button>
                        <button onClick={() => triggerSave('HD')} className="editor-button editor-button-hd">Надіслати HD</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditorModal;
