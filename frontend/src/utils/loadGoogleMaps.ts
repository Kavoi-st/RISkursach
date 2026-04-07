type LoadOpts = {
  apiKey: string;
};

declare global {
  interface Window {
    google?: any;
  }
}

let loadingPromise: Promise<void> | null = null;

export function loadGoogleMapsPlaces({ apiKey }: LoadOpts): Promise<void> {
  if (window.google?.maps?.places) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise<void>((resolve, reject) => {
    const scriptId = 'google-maps-js';
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
      return;
    }

    const s = document.createElement('script');
    s.id = scriptId;
    s.async = true;
    s.defer = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places`;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(s);
  });

  return loadingPromise;
}

