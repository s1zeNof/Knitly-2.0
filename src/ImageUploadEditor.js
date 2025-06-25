import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './ImageUploadEditor.css';

// Попередньо визначені фільтри (поки що заглушки)
const filters = [
  { name: 'None', value: 'none' },
  { name: 'Grayscale', value: 'grayscale(100%)' },
  { name: 'Sepia', value: 'sepia(100%)' },
  { name: 'Invert', value: 'invert(100%)' },
  { name: 'Hue Rotate', value: 'hue-rotate(90deg)' },
  { name: 'Blur', value: 'blur(5px)' },
  { name: 'Brightness', value: 'brightness(150%)' },
  { name: 'Contrast', value: 'contrast(200%)' },
  { name: 'Saturate', value: 'saturate(200%)' },
  { name: 'Vintage', value: 'sepia(60%) contrast(110%) brightness(90%) saturate(120%)' },
];

function ImageUploadEditor({ onUpload, onClose }) {
  const [upImg, setUpImg] = useState(null);
  const imgRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [aspect, setAspect] = useState(16 / 9);
  const [currentFilter, setCurrentFilter] = useState(filters[0].value);
  const [quality, setQuality] = useState('HD'); // 'SD' or 'HD'
  const [isLoading, setIsLoading] = useState(false);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Скидання кропу при виборі нового файлу
      const reader = new FileReader();
      reader.addEventListener('load', () => setUpImg(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onLoad = useCallback((img) => {
    imgRef.current = img;
    const { width, height } = img;
    const newCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect,
        width,
        height
      ),
      width,
      height
    );
    setCrop(newCrop);
    setCompletedCrop(newCrop); // Встановлюємо початковий кроп
    return false; // Повертаємо false для запобігання зацикленню
  }, [aspect]);

  const handleApplyCropAndFilter = async () => {
    if (!completedCrop || !imgRef.current) {
      // eslint-disable-next-line no-console
      console.error('Crop or image not available');
      return;
    }

    setIsLoading(true);
    // Імітація завантаження
    await new Promise(resolve => setTimeout(resolve, 1500));


    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = Math.floor(completedCrop.width * scaleX);
    canvas.height = Math.floor(completedCrop.height * scaleY);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    ctx.filter = currentFilter;

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    // TODO: Додати логіку для SD/HD якості (стиснення)
    // Наразі просто повертаємо base64
    const base64Image = canvas.toDataURL('image/jpeg', quality === 'HD' ? 0.9 : 0.7);
    onUpload(base64Image);
    setIsLoading(false);
    onClose();
  };

  const handleFilterChange = (filterValue) => {
    setCurrentFilter(filterValue);
  };

  return (
    <div className="image-upload-editor-modal">
      <div className="image-upload-editor-content">
        <button onClick={onClose} className="close-button">&times;</button>
        <h2>Редагувати зображення</h2>
        <input type="file" accept="image/*,video/*" onChange={onSelectFile} />

        {upImg && (
          <>
            <div className="crop-container">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                onLoad={onLoad}
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={upImg}
                  style={{ transform: `scale(1)`, filter: currentFilter }}
                />
              </ReactCrop>
            </div>

            <div className="controls">
                <div className="filter-controls">
                    <h3>Фільтри</h3>
                    <div className="filter-buttons">
                        {filters.map(f => (
                            <button
                                key={f.name}
                                onClick={() => handleFilterChange(f.value)}
                                className={currentFilter === f.value ? 'active' : ''}
                            >
                                {f.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="quality-controls">
                    <h3>Якість</h3>
                    <button onClick={() => setQuality('SD')} className={quality === 'SD' ? 'active' : ''}>SD</button>
                    <button onClick={() => setQuality('HD')} className={quality === 'HD' ? 'active' : ''}>HD</button>
                </div>
            </div>
          </>
        )}

        {isLoading && (
            <div className="loading-animation">
                <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
            </div>
        )}

        <button onClick={handleApplyCropAndFilter} disabled={!completedCrop || isLoading} className="apply-button">
          {isLoading ? 'Завантаження...' : 'Застосувати та завантажити'}
        </button>
      </div>
    </div>
  );
}

export default ImageUploadEditor;
