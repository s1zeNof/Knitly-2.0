// src/emojiPackCache.js
const animatedPackCache = new Set();

export const cacheAnimatedPackId = (packId) => {
    animatedPackCache.add(packId);
};

export const isPackAnimated = (packId) => {
    return animatedPackCache.has(packId);
};