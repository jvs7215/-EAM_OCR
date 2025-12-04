# PaddleOCR Migration Complete! 🎉

The OCR system has been migrated from Tesseract to PaddleOCR for better accuracy and performance.

## Quick Start

### 1. Install Python Dependencies

First, install the Python packages required for PaddleOCR:

```bash
npm run install:python-deps
```

Or manually:
```bash
cd server
pip install -r requirements.txt
```

**Note:** On first run, PaddleOCR will download model files (~200-500MB). This is automatic and only happens once.

### 2. Start the Application

```bash
npm run dev
```

This will start:
- **Python OCR Service** (port 3001) - Handles OCR processing
- **Node.js Server** (port 3000) - API server
- **React Client** (port 5173) - Frontend

## What Changed?

### Files Added:
- `server/ocr_service.py` - Python FastAPI service for PaddleOCR
- `server/requirements.txt` - Python dependencies
- `server/README_PADDLEOCR.md` - Detailed setup guide

### Files Modified:
- `server/ocr.js` - Now calls Python service instead of Tesseract
- `server/package.json` - Removed Tesseract, added node-fetch and form-data
- `package.json` - Added OCR service script

### Files Removed:
- Tesseract.js dependency (no longer needed)

## Benefits of PaddleOCR

✅ **Better Accuracy** - Typically 10-20% more accurate than Tesseract  
✅ **Faster Processing** - Optimized deep learning models  
✅ **Better Layout Handling** - Handles complex document layouts better  
✅ **Multi-language Support** - Easy to add more languages later  

## Troubleshooting

### Python Not Found
- Make sure Python 3.7+ is installed
- On Windows, try `python3` instead of `python`
- Check: `python --version`

### Port 3001 Already in Use
- Change port in `server/ocr_service.py` (line 89)
- Update `PADDLE_OCR_URL` environment variable

### Service Won't Start
- Check Python is installed: `python --version`
- Install dependencies: `pip install -r server/requirements.txt`
- Check for port conflicts: `netstat -ano | findstr :3001`

### First Request is Slow
- Normal! PaddleOCR loads models on first request
- Subsequent requests are much faster
- Models are cached after first load

## Environment Variables

- `PADDLE_OCR_URL` - Override OCR service URL (default: http://localhost:3001)

## Need Help?

See `server/README_PADDLEOCR.md` for detailed troubleshooting and setup instructions.

