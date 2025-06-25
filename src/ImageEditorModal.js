import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import FilerobotImageEditor, { TABS } from 'react-filerobot-image-editor';
import './ImageEditorModal.css';

const ImageEditorModal = ({ isOpen, imageToEdit, onClose, onSave }) => {
    const [key, setKey] = useState(0);
    const filerobotEditorRef = useRef(null); // Ref for the editor instance

    useEffect(() => {
        if (imageToEdit) {
            setKey(prevKey => prevKey + 1);
        }
    }, [imageToEdit]);

    if (!isOpen || !imageToEdit) {
        return null;
    }

    const handleSave = (editedImageObject) => {
        // We'll pass the quality setting later
        onSave(editedImageObject, 'HD'); // Placeholder for quality
        onClose(); // Close modal after save
    };

    // Convert File object to URL for the editor
    const imageUrl = imageToEdit instanceof File ? URL.createObjectURL(imageToEdit) : imageToEdit;

    return (
        <div className="image-editor-modal-overlay">
            <div className="image-editor-modal-content">
                <FilerobotImageEditor
                    key={key} // Force re-mount when image changes
                    source={imageUrl}
                    source={imageUrl}
                    onSave={handleSave}
                    onClose={onClose}
                    // Available TABS: ADJUST, ANNOTATE, WATERMARK, FILTERS, FINETUNE, CROP, RESIZE
                    // Available TOOLS: TEXT, IMAGE, RECT, ELLIPSE, PEN, LINE, ARROW, WATERMARK, CROP, ROTATE, FLIP, BRIGHTNESS, CONTRAST, HSV, VIBRANCE, WARMTH, EXPOSURE, GAMMA, BLUR, SHARPEN, THRESHOLD, NOISE, INVERT, BLACK_WHITE, SEPIA, GRAYSCALE, VINTAGE, CONCERT, MORNING, CANDY, SUNNY, COOL, NOSTALGIA, WONDER, FOREST, LEMON, PINK_AURA, NIGHT_MODE, CHROME, MONO, NATURE, BEAUTY, DREAMY, RETRO, SCARLET
                    tabsIds={[TABS.CROP, TABS.FILTERS, TABS.FINETUNE, TABS.ADJUST]}
                    defaultTabId={TABS.CROP}
                    defaultToolId="CROP" // For CROP tab, default tool is also CROP
                    translations={{
                        // Common
                        save: 'Зберегти',
                        cancel: 'Скасувати',
                        close: 'Закрити',
                        apply: 'Застосувати',
                        // Tabs
                        [TABS.CROP]: 'Обрізка',
                        [TABS.FILTERS]: 'Фільтри',
                        [TABS.FINETUNE]: 'Тонке налаштування',
                        [TABS.ADJUST]: 'Налаштування',
                        // Tools within tabs (some might be auto-translated by tab name, others might need specifics)
                        // Crop specific
                        cropOriginalRatio: 'Оригінал',
                        cropCustomRatio: 'Власний',
                        // Filter names (These are examples, actual filter names depend on the library)
                        // We aim for ~10 filters. The library provides many. We might need to customize which ones are shown if possible,
                        // or instruct the user to pick from the available list. For now, we rely on the library's default set in TABS.FILTERS.
                        // Finetune
                        brightness: 'Яскравість',
                        contrast: 'Контраст',
                        saturation: 'Насиченість', // (HSV - Hue, Saturation, Value) - Saturation is part of HSV
                        vibrance: 'Соковитість',
                        warmth: 'Теплота',
                        exposure: 'Експозиція',
                        gamma: 'Гамма',
                        blur: 'Розмиття',
                        sharpen: 'Різкість',
                        // Adjust (might overlap with Finetune, or offer different controls)
                        // Note: The library might have its own internal translations for EN by default.
                        // We are overriding or providing UA where needed.
                    }}
                    theme={{
                        palette: {
                            'bg-primary': '#232323', // Main background of panels
                            'bg-secondary': '#1a1a1a', // Canvas background
                            'accent-primary': '#6c5ce7', // Main accent color (buttons, active states) - purple like
                            'accent-primary-active': '#5847d3', // Darker accent for active/hover
                            'icons-primary': '#ffffff', // Primary icons
                            'icons-secondary': '#a0a0a0', // Secondary/inactive icons
                            'txt-primary': '#ffffff', // Primary text
                            'txt-secondary': '#b0b0b0', // Secondary text
                            'borders-primary': '#3a3a3a',
                            'borders-secondary': '#4f4f4f',
                            'borders-strong': '#606060',
                            'light-shadow': 'rgba(0, 0, 0, 0.2)', // Shadows
                        },
                        typography: {
                            fontFamily: "'Inter', sans-serif", // Match your site's font if possible
                        },
                    }}
                    // To limit filters, we might need to customize the "FILTERS" tab or use a combination of FINETUNE/ADJUST tools.
                    // For now, enabling the FILTERS tab will show all its default filters.
                    // If more granular control over the 10 filters is needed and not directly supported by `tabsIds` or tool configuration,
                    // this might require a more complex setup or forking/extending the library's UI.
                />
            </div>
        </div>
    );
};

export default ImageEditorModal;
