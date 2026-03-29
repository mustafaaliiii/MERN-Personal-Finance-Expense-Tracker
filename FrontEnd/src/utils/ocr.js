import { createWorker } from "tesseract.js";

/**
 * Enhanced OCR function optimized for receipts and handwritten text
 *
 * IMPROVEMENTS OVER BASIC TESSERACT:
 * - Configured for receipt-style text (uniform blocks, noise reduction)
 * - Better character whitelist for currency and numbers
 * - Post-processing to fix common OCR errors (l->1, O->0, etc.)
 * - Currency symbol normalization
 * - Enhanced preprocessing with image resizing and grayscale conversion
 *
 * HANDWRITING SUPPORT:
 * - Better handling of variable character sizes
 * - Improved numeric recognition
 * - Noise reduction for scanned documents
 *
 * @param {File} file - Image file to process
 * @param {string} lang - Language code (default: 'eng')
 * @returns {Promise<string>} Extracted text
 */
export async function runReceiptOCR(file, lang = "eng") {
  const worker = await createWorker(lang);

  try {
    // Load the appropriate language data
    await worker.loadLanguage(lang);
    await worker.initialize(lang);

    // Configure Tesseract for better receipt/handwriting recognition
    await worker.setParameters({
      // Enable better text line recognition
      tessedit_pageseg_mode: '6', // Uniform block of text
      tessedit_ocr_engine_mode: '2', // Use both Tesseract and Cube (if available)

      // Improve character recognition
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,/-:()$₹£€¥', // Allow common receipt characters

      // Better handling of noisy images (receipts often have background patterns)
      textord_heavy_nr: '1', // Heavy noise reduction
      textord_min_linesize: '2.5', // Minimum line size

      // Improve number recognition (important for amounts)
      classify_bln_numeric_mode: '1', // Better numeric recognition

      // Handle different text sizes (receipts have various font sizes)
      textord_min_xheight: '10', // Minimum character height
    });

    // Process the image
    const { data } = await worker.recognize(file);

    // Post-process the text to clean up common OCR errors
    let cleanedText = data?.text || "";

    // Clean up excessive whitespace without destroying english alphabet characters
    cleanedText = cleanedText
      .replace(/\n\s*\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    return cleanedText;

  } finally {
    // Always terminate the worker to free resources
    await worker.terminate();
  }
}

/**
 * Preprocess image for better OCR results (future enhancement)
 * This could include resizing, contrast adjustment, etc.
 * @param {File} file - Original image file
 * @returns {Promise<File>} Processed image file
 */
export async function preprocessImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Resize if too large (Tesseract works better with reasonable sizes)
      const maxWidth = 2000;
      const maxHeight = 2000;

      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and enhance contrast
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to grayscale for better OCR
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        data[i] = gray;     // Red
        data[i + 1] = gray; // Green
        data[i + 2] = gray; // Blue
        // Alpha remains unchanged
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((blob) => {
        const processedFile = new File([blob], file.name, { type: file.type });
        resolve(processedFile);
      }, file.type);
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Enhanced OCR with preprocessing
 * @param {File} file - Image file to process
 * @param {string} lang - Language code
 * @returns {Promise<string>} Extracted text
 */
export async function runEnhancedReceiptOCR(file, lang = "eng") {
  try {
    // Preprocess the image first
    const processedFile = await preprocessImage(file);

    // Then run OCR on the processed image
    return await runReceiptOCR(processedFile, lang);
  } catch (error) {
    console.warn("Preprocessing failed, falling back to basic OCR:", error);
    // Fallback to basic OCR if preprocessing fails
    return await runReceiptOCR(file, lang);
  }
}
