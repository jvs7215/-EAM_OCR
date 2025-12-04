# PaddleOCR Setup Instructions

## Prerequisites

1. **Python 3.7+** installed on your system
2. **pip** (Python package manager)

## Installation Steps

1. **Install Python dependencies:**
   ```bash
   cd server
   pip install -r requirements.txt
   ```

   Or use the npm script:
   ```bash
   npm run install:python-deps
   ```

2. **First-time setup notes:**
   - PaddleOCR will download model files on first run (~200-500MB)
   - This happens automatically when the service starts
   - Subsequent starts will be faster

## Running the Service

### Option 1: Run everything together (recommended)
```bash
npm run dev
```
This starts:
- Node.js server (port 3000)
- Python OCR service (port 3001)
- React client (port 5173)

### Option 2: Run services separately

**Terminal 1 - Python OCR Service:**
```bash
cd server
python ocr_service.py
```

**Terminal 2 - Node.js Server:**
```bash
cd server
node index.js
```

**Terminal 3 - React Client:**
```bash
cd client
npm run dev
```

## Troubleshooting

### Python not found
- Make sure Python 3.7+ is installed
- On Windows, you may need to use `python3` instead of `python`
- Check with: `python --version` or `python3 --version`

### Port 3001 already in use
- Change the port in `ocr_service.py` (line 89)
- Update `PADDLE_OCR_URL` in `ocr.js` or set environment variable

### PaddleOCR installation fails
- Make sure you have the latest pip: `pip install --upgrade pip`
- On some systems, you may need: `pip3 install -r requirements.txt`
- For GPU support, install CUDA-enabled PaddlePaddle (see PaddleOCR docs)

### Model download is slow
- First run downloads models (~200-500MB)
- Models are cached for future use
- Consider downloading models manually if needed

## Performance Notes

- First request may be slower (model loading)
- Subsequent requests are faster
- PaddleOCR is generally faster and more accurate than Tesseract
- Memory usage: ~500MB-1GB for the OCR service

## Environment Variables

- `PADDLE_OCR_URL`: Override the OCR service URL (default: http://localhost:3001)

