# Quick Start Guide

## If OCR is not working, follow these steps:

### Step 1: Make sure all dependencies are installed

**Node.js dependencies:**
```bash
cd server
npm install
```

**Python dependencies:**
```bash
cd server
python -m pip install -r requirements.txt
```

### Step 2: Start the servers

**Option A: Start everything at once (Recommended)**
```bash
npm run dev
```

**Option B: Start services separately (if Option A doesn't work)**

**Terminal 1 - Python OCR Service:**
```bash
cd server
python ocr_service.py
```
You should see: `Uvicorn running on http://0.0.0.0:3001`

**Terminal 2 - Node.js Server:**
```bash
cd server
node index.js
```
You should see: `Server running at http://localhost:3000`

**Terminal 3 - React Client:**
```bash
cd client
npm run dev
```
You should see: `Local: http://localhost:5173`

### Step 3: Verify servers are running

Open a new terminal and run:
```bash
netstat -ano | findstr ":3000"
netstat -ano | findstr ":3001"
```

Both should show LISTENING status.

### Step 4: Test in browser

1. Open `http://localhost:5173`
2. Try uploading a document
3. Check browser console (F12) for any errors
4. Check terminal output for server errors

## Common Issues

### "Cannot connect to OCR server"
- **Solution**: Make sure Node.js server (port 3000) is running
- Check: `netstat -ano | findstr ":3000"`

### "PaddleOCR service is not running"
- **Solution**: Make sure Python OCR service (port 3001) is running
- Check: `netstat -ano | findstr ":3001"`
- Start it: `cd server && python ocr_service.py`

### CORS errors
- **Solution**: Make sure Node.js server is running and CORS is enabled
- The server should show: `Server running at http://localhost:3000`

### Port already in use
- **Solution**: Kill the process using the port or change the port in the config files

## Still having issues?

1. Check all terminal windows for error messages
2. Make sure Python 3.7+ is installed: `python --version`
3. Make sure Node.js is installed: `node --version`
4. Try restarting all services
5. Check firewall isn't blocking localhost connections

