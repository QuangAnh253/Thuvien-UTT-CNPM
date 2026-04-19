const loadedImages = new Set<string>();

export const preloadImage = (src: string) => {
  const url = String(src || '').trim();
  if (!url || loadedImages.has(url) || typeof window === 'undefined') return;

  loadedImages.add(url);
  const image = new Image();
  image.decoding = 'async';
  image.loading = 'eager';
  image.src = url;
};

export const preloadImages = (sources: string[]) => {
  sources.forEach(preloadImage);
};
