import React, { useState, useEffect } from 'react'; // Added useEffect
import './ImageWithLoader.css';
import FullscreenImageViewer from './FullscreenImageViewer'; // Import FullscreenImageViewer

// Added uploadProgress prop and error prop
const ImageWithLoader = ({ src, alt, className, isUploading, uploadProgress, error }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(error || false);
  const [isFullscreen, setIsFullscreen] = useState(false); // State for fullscreen view

  useEffect(() => {
    setIsError(error || false); // Update isError if error prop changes
  }, [error]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setIsError(false);
  };

  const handleImageError = () => {
    // Якщо src - це blob URL, помилка завантаження самого blob URL означає, що він недійсний,
    // або щось пішло не так з його відображенням.
    // Встановлюємо isLoading в false, щоб припинити показ лоадера і показати помилку.
    setIsLoading(false);
    setIsError(true);
  };

  const toggleFullscreen = (e) => {
    e.stopPropagation(); // Prevent triggering other click listeners like message selection
    if (!isError && !isUploading) { // Allow opening only if image is loaded and not uploading
        // For blob URLs that are still "isLoading" (meaning the img tag hasn't fired onLoad yet),
        // we might want to allow fullscreen if the src is present.
        // However, it's safer to wait for onLoad to ensure the image is actually displayable.
        if (!isLoading || (isLoading && src?.startsWith('blob:'))) {
             setIsFullscreen(true);
        }
    }
  };

  let contentPlaceholder;
  if (isError) {
    // Якщо є помилка, завжди показуємо плейсхолдер помилки
    contentPlaceholder = <div className="image-error-placeholder">Помилка відображення</div>;
  } else if (isLoading) {
    // Якщо завантаження (isLoading=true) і немає помилки:
    // Для не-blob URL показуємо стандартний лоадер.
    // Для blob URL лоадер не показуємо (або показуємо мінімальний),
    // бо очікуємо, що img тег сам впорається або викличе onError.
    if (!src?.startsWith('blob:')) {
      contentPlaceholder = <div className="image-loader"></div>;
    } else {
      contentPlaceholder = null; // Або якийсь мінімальний індикатор для blob, якщо потрібно
    }
  } else {
    // Якщо не isLoading і не isError, значить зображення завантажено, плейсхолдер не потрібен.
    contentPlaceholder = null;
  }

  const showUploadIndicator = isUploading && typeof uploadProgress === 'number';
  const canBeClicked = !isError && !isUploading && (!isLoading || (isLoading && src?.startsWith('blob:')));

  return (
    <>
      <div
        className={`image-with-loader-container ${className || ''} ${isUploading ? 'uploading' : ''} ${isError ? 'error' : ''} ${canBeClicked ? 'clickable' : ''}`}
        onClick={canBeClicked ? toggleFullscreen : undefined}
      >
        {contentPlaceholder}
        <img
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            // Показуємо img, якщо немає помилки АБО якщо це blob URL, який ще не викликав помилку.
            // Ховаємо, якщо є помилка (isError = true).
            // Також ховаємо, якщо isLoading=true І це НЕ blob URL (бо для них є окремий contentPlaceholder).
            display: isError ? 'none' : (isLoading && !src?.startsWith('blob:')) ? 'none' : 'block',
            opacity: isUploading ? 0.5 : 1
          }}
        />
        {showUploadIndicator && (
          <div className="upload-progress-overlay">
            <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
            <span className="upload-progress-text">{Math.round(uploadProgress)}%</span>
          </div>
        )}
        {!isUploading && isError && (
            <div className="image-error-indicator">!</div>
        )}
      </div>
      {isFullscreen && (
        <FullscreenImageViewer
          src={src}
          alt={alt}
          onClose={() => setIsFullscreen(false)}
        />
      )}
    </>
  );
};

export default ImageWithLoader;
