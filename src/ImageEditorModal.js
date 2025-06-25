import React, { useState, useCallback, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './ImageEditorModal.css';

const ImageEditorModal = ({ src, onClose, onSave }) => {
  const [crop, setCrop] = useState({ unit: '%', width: 50, x: 25, y: 25, aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [quality, setQuality] = useState('HD'); // 'SD' or 'HD'
  const imgRef = useRef(null);

  const onLoad = useCallback((img) => {
    imgRef.current = img;
    const aspect = 1;
    const width = 50;
    const height = (img.height / img.width) * width;
    const x = (100 - width) / 2;
    const y = (100 - height) / 2;
    setCrop({ unit: '%', width, height, x, y, aspect });
    // Automatically trigger a completed crop update after load
    // This ensures completedCrop is set even if the user doesn't interact
    setCompletedCrop({
        unit: 'px',
        x: (img.naturalWidth * x) / 100,
        y: (img.naturalHeight * y) / 100,
        width: (img.naturalWidth * width) / 100,
        height: (img.naturalHeight * height) / 100,
        aspect,
      });
    return false; // Important
  }, []);

  const handleSave = async () => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current) {
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      let cropTargetWidth = completedCrop.width * scaleX;
      let cropTargetHeight = completedCrop.height * scaleY;

      // Визначаємо кінцеві розміри зображення після зміни якості (SD/HD)
      let finalWidth = cropTargetWidth;
      let finalHeight = cropTargetHeight;

      if (quality === 'SD') {
        const MAX_DIMENSION_SD = 800;
        if (finalWidth > MAX_DIMENSION_SD || finalHeight > MAX_DIMENSION_SD) {
          if (finalWidth > finalHeight) {
            finalHeight = (finalHeight / finalWidth) * MAX_DIMENSION_SD;
            finalWidth = MAX_DIMENSION_SD;
          } else {
            finalWidth = (finalWidth / finalHeight) * MAX_DIMENSION_SD;
            finalHeight = MAX_DIMENSION_SD;
          }
        }
      } else { // HD
        const MAX_DIMENSION_HD = 1920;
        if (finalWidth > MAX_DIMENSION_HD || finalHeight > MAX_DIMENSION_HD) {
          if (finalWidth > finalHeight) {
            finalHeight = (finalHeight / finalWidth) * MAX_DIMENSION_HD;
            finalWidth = MAX_DIMENSION_HD;
          } else {
            finalWidth = (finalWidth / finalHeight) * MAX_DIMENSION_HD;
            finalHeight = MAX_DIMENSION_HD;
          }
        }
      }

      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext('2d');

      // Застосовуємо фільтр до контексту канвасу
      if (activeFilter && activeFilter.filter && activeFilter.filter !== 'none') {
        ctx.filter = activeFilter.filter;
      } else {
        ctx.filter = 'none'; // Переконуємось, що фільтр скинуто, якщо 'None'
      }

      ctx.drawImage(
        image, // Оригінальне зображення
        completedCrop.x * scaleX, // Координата X обрізки на оригінальному зображенні
        completedCrop.y * scaleY, // Координата Y обрізки на оригінальному зображенні
        cropTargetWidth,          // Ширина обрізаної області на оригінальному зображенні
        cropTargetHeight,         // Висота обрізаної області на оригінальному зображенні
        0,                        // Координата X для малювання на канвасі (початок)
        0,                        // Координата Y для малювання на канвасі (початок)
        finalWidth,               // Кінцева ширина зображення на канвасі
        finalHeight               // Кінцева висота зображення на канвасі
      );

      // Скидаємо фільтр після малювання, щоб він не впливав на інші операції
      ctx.filter = 'none';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Canvas is empty');
            return;
          }
          onSave(blob);
          onClose();
        },
        'image/jpeg',
        quality === 'HD' ? 0.92 : 0.75 // Adjust quality setting for HD/SD
      );
    }
  };

  // TODO: Implement filters
  const handleApplyFilter = (filterName) => {
    console.log(`Applying filter: ${filterName}`);
    // This is where filter logic would go.
    // For now, it's a placeholder.
  };

  const filters = [
    { name: 'None', style: { filter: 'none' } }, // Явно вказуємо 'none'
    { name: 'Sepia', style: { filter: 'sepia(1)' } },
    { name: 'Grayscale', style: { filter: 'grayscale(1)' } },
    { name: 'Invert', style: { filter: 'invert(1)' } },
    { name: 'Яскравість', style: { filter: 'brightness(1.5)' } }, // Brightness
    { name: 'Контраст', style: { filter: 'contrast(1.8)' } },    // Contrast (зменшив значення)
    { name: 'Розмиття', style: { filter: 'blur(2px)' } },        // Blur (зменшив значення)
    { name: 'Насиченість', style: { filter: 'saturate(2)' } },   // Saturate
    { name: 'Відтінок', style: { filter: 'hue-rotate(90deg)' } },// Hue-rotate
    { name: 'Теплий', style: { filter: 'sepia(0.4) saturate(1.5) hue-rotate(-10deg) contrast(0.9) brightness(1.1)' } }, // Instagram-like (приклад)
    // Додайте більше комбінованих фільтрів за потреби
  ];
  const [activeFilter, setActiveFilter] = useState(filters[0].style); // Зберігаємо весь об'єкт style


  return (
    <div className="image-editor-modal-overlay">
      <div className="image-editor-modal-content">
        <h2>Редагувати зображення</h2>
        <div className="editor-main-area">
          <div className="crop-container">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1} // Or allow dynamic aspect ratio
            >
              <img
                ref={imgRef}
                alt="Crop"
                src={src}
                onLoad={(e) => onLoad(e.target)}
                style={{ ...activeFilter, maxHeight: '60vh', maxWidth: '100%' }}
              />
            </ReactCrop>
          </div>
          <div className="filters-panel">
            <h3>Фільтри</h3>
            <div className="filters-grid">
              {filters.map((filter) => (
                <button
                  key={filter.name}
                  className={`filter-preview ${activeFilter.filter === filter.style.filter ? 'active' : ''}`} // Порівнюємо значення filter
                  onClick={() => setActiveFilter(filter.style)}
                  title={filter.name}
                >
                  <img src={src} alt={filter.name} style={{...filter.style, width: '100%', height: '100%', objectFit: 'cover'}} />
                  <span>{filter.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="quality-selector">
          Якість:
          <button
            className={quality === 'SD' ? 'active' : ''}
            onClick={() => setQuality('SD')}
          >
            SD
          </button>
          <button
            className={quality === 'HD' ? 'active' : ''}
            onClick={() => setQuality('HD')}
          >
            HD
          </button>
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="cancel-button">Скасувати</button>
          <button onClick={handleSave} className="save-button">Зберегти</button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorModal;
