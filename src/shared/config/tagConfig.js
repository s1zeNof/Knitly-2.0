// src/config/tagConfig.js

function importAll(r) {
  let images = {};
  r.keys().forEach((item) => {
    // Ключ тепер завжди буде в нижньому регістрі
    const key = item.replace('./', '').replace(/\.[^/.]+$/, "").toLowerCase();
    images[key] = r(item);
  });
  return images;
}

const imagesContext = require.context('../../img/tags', false, /\.(png|jpe?g|svg)$/);
const illustrationsMap = importAll(imagesContext);

// Запасне зображення також шукаємо за ключем в нижньому регістрі
const defaultIllustration = illustrationsMap['default-tag'];

/**
 * Експортуємо одну функцію, яка повертає ілюстрацію для тегу.
 * @param {string} slug - Назва тегу (напр., 'phonk' або 'indie-rock').
 * @returns {string} - Шлях до зображення.
 */
export function getTagIllustration(slug) {
  const searchSlug = slug.toLowerCase();
  
  if (!illustrationsMap[searchSlug] && !defaultIllustration) {
    console.error(`Не знайдено ілюстрацію для "${slug}" та відсутня дефолтна ілюстрація!`);
    return ''; 
  }
  return illustrationsMap[searchSlug] || defaultIllustration;
}