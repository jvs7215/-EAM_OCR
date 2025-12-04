# How to Start Servers and See Errors

## Step-by-Step Instructions

### Option 1: Start Each Service in Separate Terminal Windows (Recommended for Debugging)

1. **Open Terminal 1 - Python OCR Service:**
   - Open Cursor's terminal (Ctrl + ` or Terminal → New Terminal)
   - Or open a new PowerShell/Command Prompt window
   - Navigate to the server folder:
     ```bash
     cd "C:\Users\Delta Flyer\Documents\antiGravSites\EAM_OCR\server"
     ```
   - Start the Python service:
     ```bash
     python ocr_service.py
     ```
   - **Keep this terminal open** - you'll see error messages here
   - You should see: `INFO:     Uvicorn running on http://0.0.0.0:3001`

2. **Open Terminal 2 - Node.js Server:**
   - Open another terminal window (or new tab in Cursor)
   - Navigate to the server folder:
     ```bash
     cd "C:\Users\Delta Flyer\Documents\antiGravSites\EAM_OCR\server"
     ```
   - Start the Node.js server:
     ```bash
     node index.js
     ```
   - **Keep this terminal open** - you'll see error messages here
   - You should see: `Server running at http://localhost:3000`

3. **Open Terminal 3 - React Client (if not already running):**
   - Open another terminal window
   - Navigate to the client folder:
     ```bash
     cd "C:\Users\Delta Flyer\Documents\antiGravSites\EAM_OCR\client"
     ```
   - Start the client:
     ```bash
     npm run dev
     ```

### Option 2: Use Cursor's Integrated Terminal

1. In Cursor, press **Ctrl + `** (backtick) to open terminal
2. Click the **+** button or **Split Terminal** to create multiple terminal panes
3. Run each service in a separate pane

### What to Look For

When you try to upload a file, watch the **Python OCR Service terminal** (Terminal 1). You should see:
- `INFO: Processing image: filename.jpg`
- Any error messages in red
- Stack traces showing what went wrong

Also watch the **Node.js Server terminal** (Terminal 2) for:
- `[OCR] Starting PaddleOCR processing for: ...`
- `[OCR] Sending request to PaddleOCR service...`
- Any error messages

### If You Don't See a Terminal

If the services are running in the background and you can't see them:
1. Check Task Manager for Python and Node processes
2. Kill them (End Task)
3. Start them fresh using the steps above

