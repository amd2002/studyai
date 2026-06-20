// OCR client-side — extracts text from an image BEFORE sending to Claude.
// This saves tokens (and money) by sending plain text instead of a base64 image
// whenever the photo is clear enough to read automatically.
//
// Tesseract.js runs entirely in the browser (no server, no API key needed).
// Loaded lazily from CDN so it doesn't bloat the initial bundle.

let tesseractPromise: Promise<any> | null = null;

function loadTesseract(): Promise<any> {
  if ((window as any).Tesseract) return Promise.resolve((window as any).Tesseract);
  if (tesseractPromise) return tesseractPromise;

  tesseractPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.onload = () => resolve((window as any).Tesseract);
    script.onerror = () => reject(new Error('Failed to load Tesseract.js'));
    document.head.appendChild(script);
  });

  return tesseractPromise;
}

export interface OcrResult {
  text: string;
  confidence: number; // 0-100
  success: boolean; // true if text is long enough to be useful
}

const MIN_USEFUL_CHARS = 20;

/**
 * Run OCR on an image (base64 data URL or Blob) and return extracted text.
 * Supports Chinese (Simplified + Traditional) + English by default since
 * that's the primary use case (Chinese course photos).
 */
export async function extractTextFromImage(
  imageDataUrl: string,
  lang: string = 'chi_sim+eng'
): Promise<OcrResult> {
  try {
    const Tesseract = await loadTesseract();
    const result = await Tesseract.recognize(imageDataUrl, lang);
    const text = (result?.data?.text || '').trim();
    const confidence = result?.data?.confidence ?? 0;

    return {
      text,
      confidence,
      success: text.length >= MIN_USEFUL_CHARS,
    };
  } catch (e) {
    console.warn('OCR failed, falling back to image upload:', e);
    return { text: '', confidence: 0, success: false };
  }
}
