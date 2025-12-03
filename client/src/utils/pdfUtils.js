import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set worker source to local file
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function convertPdfToImages(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const images = [];

        console.log(`PDF loaded. Pages: ${pdf.numPages}`);

        for (let i = 1; i <= pdf.numPages; i++) {
            console.log(`Rendering page ${i}...`);
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // Scale up for better OCR quality

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            images.push(blob);
        }

        return images;
    } catch (error) {
        console.error('PDF Conversion Error:', error);
        throw new Error('Failed to convert PDF. Please ensure the file is a valid PDF.');
    }
}
