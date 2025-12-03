const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function preprocessImage(imagePath) {
    try {
        const preprocessedPath = imagePath.replace(path.extname(imagePath), '_processed.png');

        await sharp(imagePath)
            .resize(3000, 3000, { // Increase resolution
                fit: 'inside',
                withoutEnlargement: false
            })
            .greyscale() // Convert to grayscale
            .normalize() // Normalize contrast
            .sharpen() // Sharpen edges
            .threshold(128) // Binarize (black & white)
            .toFile(preprocessedPath);

        return preprocessedPath;
    } catch (error) {
        console.error('Preprocessing error:', error);
        return imagePath; // Fall back to original if preprocessing fails
    }
}

async function processImage(imagePath) {
    console.log(`[OCR] Starting processing for: ${imagePath}`);
    try {
        // Preprocess the image for better OCR accuracy
        console.log('[OCR] Preprocessing image...');
        const processedPath = await preprocessImage(imagePath);
        console.log(`[OCR] Preprocessing complete. New path: ${processedPath}`);

        console.log('[OCR] Starting Tesseract recognition...');
        const result = await Tesseract.recognize(
            processedPath,
            'eng',
            {
                logger: m => console.log(`[Tesseract] ${m.status}: ${Math.round(m.progress * 100)}%`),
                tessedit_pageseg_mode: Tesseract.PSM.AUTO,
                preserve_interword_spaces: '1'
            }
        );
        console.log('[OCR] Tesseract recognition complete.');

        // Clean up preprocessed file
        if (processedPath !== imagePath) {
            console.log('[OCR] Cleaning up preprocessed file...');
            fs.unlink(processedPath, (err) => {
                if (err) console.error('[OCR] Error deleting preprocessed file:', err);
                else console.log('[OCR] Preprocessed file deleted.');
            });
        }

        return result;
    } catch (error) {
        console.error('[OCR] Fatal Error:', error);
        throw error;
    }
}

module.exports = { processImage };
