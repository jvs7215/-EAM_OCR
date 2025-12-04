# Quick Fix Instructions

## The Problem
The Python OCR service has two issues:
1. The `cls=True` parameter is not supported (FIXED in code)
2. Port 3001 might be in use

## Solution

### Step 1: Stop all Python processes
In a terminal, run:
```powershell
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Step 2: Start the Python OCR service manually
```powershell
cd server
python ocr_service.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:3001
```

**Keep this terminal open** - you'll see errors here if something goes wrong.

### Step 3: Verify it's working
In another terminal, test:
```powershell
curl http://localhost:3001/health
```

You should get: `{"status":"ok","service":"paddleocr"}`

### Step 4: Try uploading a document
Now try uploading a document in your browser. Watch the Python terminal for any errors.

## If it still doesn't work

Check the Python terminal for error messages and share them. The most common issues are:
- Port already in use (kill Python processes first)
- PaddleOCR initialization errors (will show in terminal)
- Missing dependencies (run `pip install -r requirements.txt`)

