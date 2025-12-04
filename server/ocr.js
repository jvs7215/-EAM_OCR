const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');

/**
 * Preprocess image for better OCR accuracy
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Buffer>} - Preprocessed image buffer
 */
async function preprocessImage(imagePath) {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    // Resize if too large (max 2000px on longest side for faster processing)
    let processed = image;
    if (metadata.width > 2000 || metadata.height > 2000) {
      const maxDimension = Math.max(metadata.width, metadata.height);
      const scale = 2000 / maxDimension;
      processed = processed.resize(Math.round(metadata.width * scale), Math.round(metadata.height * scale));
    }
    
    // Apply preprocessing for better OCR
    return await processed
      .greyscale() // Convert to grayscale
      .normalize() // Normalize contrast
      .sharpen() // Sharpen edges
      .toBuffer();
  } catch (error) {
    console.error('[OCR] Image preprocessing error:', error);
    // If preprocessing fails, return original image
    return fs.readFileSync(imagePath);
  }
}

/**
 * Process image using Tesseract OCR
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<{data: {text: string, confidence: number}}>}
 */
async function processImage(imagePath) {
  console.log(`[OCR] Starting Tesseract processing for: ${imagePath}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    // Preprocess image for better OCR accuracy
    console.log('[OCR] Preprocessing image...');
    const preprocessedBuffer = await preprocessImage(imagePath);
    
    try {
      console.log('[OCR] Running Tesseract OCR...');
      
      // Run Tesseract OCR - use buffer directly for better compatibility
      const { data } = await Tesseract.recognize(preprocessedBuffer, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      console.log(`[OCR] Tesseract processing complete. Confidence: ${data.confidence.toFixed(2)}%`);
      
      return {
        data: {
          text: data.text || '',
          confidence: data.confidence || 0
        }
      };
      
    } catch (ocrError) {
      throw ocrError;
    }
    
  } catch (error) {
    console.error('[OCR] Fatal Error:', error);
    throw error;
  }
}

module.exports = { processImage };
