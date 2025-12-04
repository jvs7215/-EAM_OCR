# EAM OCR - Erie Art Museum Document Digitizer

A web application for the Erie Art Museum to digitize and catalog archived documents using OCR (Optical Character Recognition) technology.

## Features

- **Modern UI** - Midnight purple/blue theme with intuitive design
- **Multi-Document Upload** - Process multiple files simultaneously
- **Advanced OCR** - Image preprocessing for high accuracy text extraction
- **Auto-Tagging** - Automatically extracts 20+ types of metadata:
  - People, places, organizations
  - Years, dates, times
  - Money amounts, phone numbers, emails, URLs
  - Quoted text (artwork titles)
- **Progress Tracking** - Real-time progress bar with detailed status
- **Download** - Export extracted text as .txt files
- **Responsive** - Works on desktop and mobile devices

## Tech Stack

### Frontend
- React + Vite
- Vanilla CSS
- pdfjs-dist (PDF processing)
- compromise (NLP for auto-tagging)

### Backend
- Node.js + Express
- PaddleOCR (OCR engine via Python service)
- FastAPI (Python OCR service)
- Multer (file uploads)

## Installation

### Prerequisites
- Node.js (v14 or higher)
- Python 3.7+ (for PaddleOCR)
- npm or yarn
- pip (Python package manager)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/EAM_OCR.git
cd EAM_OCR
```

2. Install frontend dependencies:
```bash
cd client
npm install
```

3. Install backend dependencies:
```bash
cd ../server
npm install
```

4. Install Python OCR dependencies:
```bash
npm run install:python-deps
```
Or manually:
```bash
cd server
pip install -r requirements.txt
```

## Running the Application

**Quick Start (Recommended):**
```bash
npm run dev
```
This starts all services:
- Python OCR Service (port 3001)
- Node.js Server (port 3000)
- React Client (port 5173)

**Or run separately:**

1. Start Python OCR service:
```bash
cd server
python ocr_service.py
```

2. Start Node.js server:
```bash
cd server
node index.js
```

3. Start React client:
```bash
cd client
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Upload Documents** - Drag and drop or click to select images/PDFs
2. **View Progress** - Watch real-time processing status
3. **Review Results** - See extracted text and auto-detected tags
4. **Download** - Export extracted text as .txt files

### Works Best With:
- ✓ Typed or printed documents
- ✓ Clear scans and photos
- ✓ High-contrast images
- ✓ PDFs with image content

### Limitations:
- ✗ Handwritten text (low accuracy)
- ✗ Heavily damaged documents
- ✗ Complex table formatting

## Project Structure

```
EAM_OCR/
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── utils/       # Utility functions
│   │   ├── App.jsx      # Main app component
│   │   └── index.css    # Global styles
│   └── package.json
├── server/              # Backend Node.js server
│   ├── index.js         # Express server
│   ├── ocr.js           # OCR processing logic (calls Python service)
│   ├── ocr_service.py   # Python FastAPI OCR service
│   ├── requirements.txt  # Python dependencies
│   ├── uploads/         # Temporary file storage
│   └── package.json
└── README.md
```

## License

Internal tool for Erie Art Museum.

## Acknowledgments

- Built with PaddleOCR (deep learning OCR engine)
- NLP powered by Compromise
- Python OCR service powered by FastAPI

## Migration Notes

This project was migrated from Tesseract.js to PaddleOCR for improved accuracy. See `SETUP_PADDLEOCR.md` for migration details.
