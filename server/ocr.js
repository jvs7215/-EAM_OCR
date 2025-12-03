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
    try {
        // Preprocess the image for better OCR accuracy
        console.log('Preprocessing image for better OCR...');
        const processedPath = await preprocessImage(imagePath);

        const result = await Tesseract.recognize(
            processedPath,
            'eng',
            {
                logger: m => console.log(m),
                tessedit_pageseg_mode: Tesseract.PSM.AUTO,
                preserve_interword_spaces: '1'
            }
        );

        // Clean up preprocessed file
        if (processedPath !== imagePath) {
            fs.unlink(processedPath, (err) => {
                if (err) console.error('Error deleting preprocessed file:', err);
            });
        }

        return result;
    } catch (error) {
        throw error;
    }
}

module.exports = { processImage };
